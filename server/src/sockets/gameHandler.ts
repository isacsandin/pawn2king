import { Server, Socket } from "socket.io"
import { GameService } from "../services/game"
import { joinQueue, leaveQueue, findMatch, getQueuePosition } from "../services/matchmaking"
import { prisma } from "../config/database"

const activeGames = new Map<string, GameService>()
const playerGames = new Map<string, string>()

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateRoomCode(): string {
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return code
}

function getUserId(socket: Socket): string {
  return (socket.data.auth?.userId || socket.data.auth?.guestId || socket.id)
}

export function registerGameHandlers(io: Server) {
  io.on("connection", (socket) => {
    const userId = getUserId(socket)
    console.log(`Socket connected: ${socket.id} (user: ${userId})`)

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
        if (!opponentSocket) return

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
          gameId: game.id,
          fen: gameService.fen,
          clock: gameService.clock,
          timeControl,
          color: "white",
        })

        opponentSocket.emit("game:start", {
          gameId: game.id,
          fen: gameService.fen,
          clock: gameService.clock,
          timeControl,
          color: "black",
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
        return socket.emit("game:error", { message: "Não é seu turno" })
      }

      const move = game.makeMove(from, to, promotion)
      if (!move) {
        return socket.emit("game:error", { message: "Movimento inválido" })
      }

      game.applyIncrement()
      await game.saveMove(from, to, move.san, promotion)

      const opponentId = userId === game.whiteId ? game.blackId : game.whiteId
      const opponentSocket = [...io.sockets.sockets.values()].find(
        (s) => getUserId(s) === opponentId
      )

      const movePayload = { gameId, move: { from, to, san: move.san, promotion }, fen: game.fen, clock: game.clock }

      socket.emit("game:move", { ...movePayload, color: "white" })
      opponentSocket?.emit("game:move", { ...movePayload, color: "black" })

      const result = game.getResult()
      if (result) {
        game.status = result.result === "1-0" ? "WHITE_WIN" : result.result === "0-1" ? "BLACK_WIN" : "DRAW"

        await prisma.game.update({
          where: { id: gameId },
          data: { status: game.status as any, pgn: game.pgn, result: result.result, finishedAt: new Date() },
        })

        const overPayload = { gameId, result: result.result, reason: result.reason, pgn: game.pgn }
        socket.emit("game:over", overPayload)
        opponentSocket?.emit("game:over", overPayload)

        activeGames.delete(gameId)
        playerGames.delete(game.whiteId)
        playerGames.delete(game.blackId)
      }
    })

    socket.on("game:resign", async ({ gameId }) => {
      const game = activeGames.get(gameId)
      if (!game) return

      const isWhite = userId === game.whiteId
      const result = isWhite ? "0-1" : "1-0"
      const status = isWhite ? "BLACK_WIN" : "WHITE_WIN"

      await prisma.game.update({
        where: { id: gameId },
        data: { status, pgn: game.pgn, result, finishedAt: new Date() },
      })

      const opponentId = game.whiteId === userId ? game.blackId : game.whiteId
      const opponentSocket = [...io.sockets.sockets.values()].find((s) => getUserId(s) === opponentId)

      const payload = { gameId, result, reason: "Desistência", pgn: game.pgn }
      socket.emit("game:over", payload)
      opponentSocket?.emit("game:over", payload)

      activeGames.delete(gameId)
      playerGames.delete(game.whiteId)
      playerGames.delete(game.blackId)
    })

    socket.on("game:draw-offer", async ({ gameId }) => {
      const game = activeGames.get(gameId)
      if (!game) return

      const opponentId = userId === game.whiteId ? game.blackId : game.whiteId
      const opponentSocket = [...io.sockets.sockets.values()].find((s) => getUserId(s) === opponentId)
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

      game.status = "DRAW"
      await prisma.game.update({
        where: { id: gameId },
        data: { status: "DRAW", pgn: game.pgn, result: "½-½", finishedAt: new Date() },
      })

      const opponentId = userId === game.whiteId ? game.blackId : game.whiteId
      const opponentSocket = [...io.sockets.sockets.values()].find((s) => getUserId(s) === opponentId)

      const payload = { gameId, result: "½-½", reason: "Empate acordado", pgn: game.pgn }
      socket.emit("game:over", payload)
      opponentSocket?.emit("game:over", payload)

      activeGames.delete(gameId)
      playerGames.delete(game.whiteId)
      playerGames.delete(game.blackId)
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
      await leaveQueue(socket.id)
    })
  })
}
