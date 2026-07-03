import { Server, Socket } from "socket.io"
import { GameService } from "../services/game"
import { joinQueue, leaveQueue, findMatch, getQueuePosition } from "../services/matchmaking"
import { prisma } from "../config/database"

const activeGames = new Map<string, GameService>()
const playerGames = new Map<string, string>()
const disconnectTimers = new Map<string, NodeJS.Timeout>()

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateRoomCode(): string {
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

function getUserId(socket: Socket): string {
  return socket.data.auth?.userId || socket.data.auth?.guestId || socket.id
}

function getOpponentId(game: GameService, userId: string): string {
  return userId === game.whiteId ? game.blackId : game.whiteId
}

function findOpponentSocket(io: Server, game: GameService, userId: string): Socket | undefined {
  const opponentId = getOpponentId(game, userId)
  return [...io.sockets.sockets.values()].find((s) => getUserId(s) === opponentId)
}

async function cleanupGame(io: Server, gameId: string, result?: string, reason?: string) {
  const game = activeGames.get(gameId)
  if (!game) return

  if (result && reason) {
    const statusMap: Record<string, string> = {
      "1-0": "WHITE_WIN",
      "0-1": "BLACK_WIN",
      "½-½": "DRAW",
    }
    game.status = statusMap[result] || "DRAW"

    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: game.status as any,
        pgn: game.pgn,
        result,
        finishedAt: new Date(),
      },
    }).catch(() => {})

    const payload = { gameId, result, reason, pgn: game.pgn }
    io.to(gameId).emit("game:over", payload)
  }

  const timer = disconnectTimers.get(game.whiteId)
  if (timer) { clearTimeout(timer); disconnectTimers.delete(game.whiteId) }
  const timer2 = disconnectTimers.get(game.blackId)
  if (timer2) { clearTimeout(timer2); disconnectTimers.delete(game.blackId) }

  io.socketsLeave(gameId)
  activeGames.delete(gameId)
  playerGames.delete(game.whiteId)
  playerGames.delete(game.blackId)
}

export function registerGameHandlers(io: Server) {
  io.on("connection", (socket) => {
    const userId = getUserId(socket)
    console.log(`Socket connected: ${socket.id} (user: ${userId})`)

    const activeGameId = playerGames.get(userId)
    if (activeGameId) {
      const game = activeGames.get(activeGameId)
      if (game && game.status === "ACTIVE") {
        socket.join(activeGameId)
        const timer = disconnectTimers.get(userId)
        if (timer) { clearTimeout(timer); disconnectTimers.delete(userId) }
        const color = userId === game.whiteId ? "white" : "black"
        socket.emit("game:start", {
          gameId: activeGameId,
          fen: game.fen,
          clock: game.clock,
          timeControl: game.timeControl,
          color,
          resumed: true,
        })
        const opponentSocket = findOpponentSocket(io, game, userId)
        opponentSocket?.emit("game:opponent-reconnected")
        console.log(`User ${userId} reconnected to game ${activeGameId}`)
      }
    }

    socket.on("matchmaking:join", async ({ timeControl }) => {
      const rating = socket.data.auth?.type === "user" ? 1200 : 1000

      await joinQueue({
        socketId: socket.id,
        userId,
        rating,
        timeControl,
        joinedAt: Date.now(),
      })

      const pos = await getQueuePosition(socket.id, timeControl)
      socket.emit("matchmaking:queue-update", { position: pos, estimatedWait: pos * 15 })

      const match = await findMatch(socket.id, timeControl, rating)
      if (match) {
        const opponentSocket = io.sockets.sockets.get(match.socketId)
        if (!opponentSocket) {
          await leaveQueue(socket.id)
          await joinQueue({ socketId: socket.id, userId, rating, timeControl, joinedAt: Date.now() })
          return
        }

        const game = await prisma.game.create({
          data: {
            whiteId: null,
            blackId: null,
            timeControl: timeControl as any,
            status: "ACTIVE",
            roomCode: generateRoomCode(),
          },
        })

        const gameService = new GameService(game.id, userId, match.userId, timeControl)
        activeGames.set(game.id, gameService)
        playerGames.set(userId, game.id)
        playerGames.set(match.userId, game.id)

        socket.join(game.id)
        opponentSocket.join(game.id)

        socket.emit("matchmaking:found", {
          gameId: game.id,
          opponent: { id: match.userId, nickname: "Oponente" },
          color: "white",
          timeControl,
        })

        opponentSocket.emit("matchmaking:found", {
          gameId: game.id,
          opponent: { id: userId, nickname: "Oponente" },
          color: "black",
          timeControl,
        })

        socket.emit("game:start", {
          gameId: game.id, fen: gameService.fen, clock: gameService.clock, timeControl, color: "white",
        })

        opponentSocket.emit("game:start", {
          gameId: game.id, fen: gameService.fen, clock: gameService.clock, timeControl, color: "black",
        })
      }
    })

    socket.on("matchmaking:leave", async () => {
      await leaveQueue(socket.id)
    })

    socket.on("game:move", async ({ gameId, from, to, promotion }) => {
      const game = activeGames.get(gameId)
      if (!game) return socket.emit("game:error", { message: "Partida não encontrada" })

      if (!game.isPlayerTurn(userId)) {
        console.log(`Turn check failed: userId=${userId}, whiteId=${game.whiteId}, blackId=${game.blackId}, turnColor=${game.turnColor}, status=${game.status}`)
        return socket.emit("game:error", { message: "Não é seu turno" })
      }

      const move = game.makeMove(from, to, promotion)
      if (!move) {
        return socket.emit("game:error", { message: "Movimento inválido" })
      }

      game.applyIncrement(move.color)
      await game.saveMove(from, to, move.san, promotion)

      const movePayload = { gameId, move: { from, to, san: move.san, promotion }, fen: game.fen, clock: game.clock }
      io.to(gameId).emit("game:move", movePayload)

      const result = game.getResult()
      if (result) {
        await cleanupGame(io, gameId, result.result, result.reason)
      }
    })

    socket.on("game:resign", async ({ gameId }) => {
      const game = activeGames.get(gameId)
      if (!game) return

      const isWhite = userId === game.whiteId
      const result = isWhite ? "0-1" : "1-0"
      await cleanupGame(io, gameId, result, "Desistência")
    })

    socket.on("game:draw-offer", async ({ gameId }) => {
      const game = activeGames.get(gameId)
      if (!game) return

      const opponentSocket = findOpponentSocket(io, game, userId)
      opponentSocket?.emit("game:draw-offer", { from: userId })
    })

    socket.on("game:draw-response", async ({ gameId, accept }) => {
      if (!accept) {
        const opponentSocket = [...io.sockets.sockets.values()].find((s) => getUserId(s) === userId)
        opponentSocket?.emit("game:draw-declined", { from: userId })
        return
      }

      const game = activeGames.get(gameId)
      if (!game) return

      await cleanupGame(io, gameId, "½-½", "Empate acordado")
    })

    socket.on("game:create-room", async ({ timeControl }) => {
      const code = generateRoomCode()
      const game = await prisma.game.create({
        data: { timeControl: timeControl as any, status: "WAITING", roomCode: code },
      })
      socket.data.roomCode = code
      socket.data.roomCreator = true
      socket.emit("game:room-created", { roomCode: code })
    })

    socket.on("game:join-room", async ({ roomCode }) => {
      const game = await prisma.game.findUnique({ where: { roomCode } })
      if (!game || game.status !== "WAITING") {
        return socket.emit("game:error", { message: "Sala não encontrada ou já iniciada" })
      }

      const creatorSocket = [...io.sockets.sockets.values()].find((s) => s.data.roomCode === roomCode)
      if (!creatorSocket) return socket.emit("game:error", { message: "Criador da sala não está mais conectado" })

      const creatorId = getUserId(creatorSocket)
      const gameService = new GameService(game.id, creatorId, userId, game.timeControl)

      activeGames.set(game.id, gameService)
      playerGames.set(creatorId, game.id)
      playerGames.set(userId, game.id)

      socket.join(game.id)
      creatorSocket.join(game.id)

      await prisma.game.update({
        where: { id: game.id },
        data: { status: "ACTIVE", startedAt: new Date() },
      })

      creatorSocket.emit("game:start", {
        gameId: game.id, fen: gameService.fen, clock: gameService.clock, timeControl: game.timeControl, color: "white",
      })
      socket.emit("game:start", {
        gameId: game.id, fen: gameService.fen, clock: gameService.clock, timeControl: game.timeControl, color: "black",
      })
    })

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`)

      await leaveQueue(socket.id)

      const gameId = playerGames.get(userId)
      if (!gameId) return

      const game = activeGames.get(gameId)
      if (!game || game.status !== "ACTIVE") {
        playerGames.delete(userId)
        return
      }

      const opponentSocket = findOpponentSocket(io, game, userId)
      opponentSocket?.emit("game:opponent-disconnected", { timeLeft: 30 })

      const timer = setTimeout(async () => {
        const gameStillActive = activeGames.get(gameId)
        if (!gameStillActive) return

        const result = userId === gameStillActive.whiteId ? "0-1" : "1-0"
        await cleanupGame(io, gameId, result, "Tempo de reconexão esgotado")
        disconnectTimers.delete(userId)
      }, 30000)

      disconnectTimers.set(userId, timer)
    })
  })
}
