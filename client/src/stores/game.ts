import { create } from "zustand"
import { Chess } from "chess.js"
import { getSocket, connectSocket } from "../services/socket"

export interface MoveInfo {
  from: string
  to: string
  san: string
  promotion?: string
}

export interface GameState {
  gameId: string | null
  color: "white" | "black" | null
  fen: string
  clock: { white: number; black: number }
  timeControl: string | null
  status: "idle" | "searching" | "playing" | "over"
  result: string | null
  reason: string | null
  pgn: string | null
  moves: MoveInfo[]
  selectedSquare: string | null
  validMoves: string[]
  lastMove: [string, string] | null
  opponent: { id: string; nickname: string } | null
  opponentStatus: "connected" | "disconnected"
  drawOffered: boolean
  roomCode: string | null

  joinMatchmaking: (timeControl: string) => void
  leaveMatchmaking: () => void
  selectSquare: (square: string) => void
  resign: () => void
  offerDraw: () => void
  respondDraw: (accept: boolean) => void
  createRoom: (timeControl: string) => void
  joinRoom: (code: string) => void
  reset: () => void
  setOpponent: (opponent: { id: string; nickname: string } | null) => void
}

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

export const useGameStore = create<GameState>((set, get) => {
  const socket = getSocket()

  socket.on("matchmaking:found", () => {
    set({ status: "searching" })
  })

  socket.on("game:start", (data) => {
    set({
      gameId: data.gameId,
      fen: data.fen || INITIAL_FEN,
      clock: data.clock,
      timeControl: data.timeControl,
      color: data.color,
      status: "playing",
      moves: [],
      result: null,
      reason: null,
      pgn: null,
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      opponent: data.opponent || null,
      opponentStatus: "connected",
      drawOffered: false,
    })
  })

  socket.on("game:move", (data) => {
    const state = get()
    set({
      fen: data.fen,
      clock: data.clock,
      moves: [...state.moves, data.move as MoveInfo],
      lastMove: [data.move.from, data.move.to] as [string, string],
      selectedSquare: null,
      validMoves: [],
    })
  })

  socket.on("game:over", (data) => {
    set({ status: "over", result: data.result, reason: data.reason, pgn: data.pgn })
  })

  socket.on("game:error", (data) => {
    console.error("Game error:", data.message)
    set({ selectedSquare: null, validMoves: [] })
  })

  socket.on("game:draw-offer", () => {
    set({ drawOffered: true })
  })

  socket.on("game:draw-declined", () => {
    set({ drawOffered: false })
  })

  socket.on("game:room-created", (data) => {
    set({ roomCode: data.roomCode })
  })

  socket.on("game:opponent-disconnected", () => {
    set({ opponentStatus: "disconnected" })
  })

  socket.on("game:opponent-reconnected", () => {
    set({ opponentStatus: "connected" })
  })

  return {
    gameId: null,
    color: null,
    fen: INITIAL_FEN,
    clock: { white: 0, black: 0 },
    timeControl: null,
    status: "idle",
    result: null,
    reason: null,
    pgn: null,
    moves: [],
    selectedSquare: null,
    validMoves: [],
    lastMove: null,
    opponent: null,
    opponentStatus: "connected",
    drawOffered: false,
    roomCode: null,

    setOpponent: (opponent) => set({ opponent }),

    joinMatchmaking: (timeControl) => {
      connectSocket()
      set({ status: "searching", timeControl })
      socket.emit("matchmaking:join", { timeControl })
    },

    leaveMatchmaking: () => {
      socket.emit("matchmaking:leave")
      set({ status: "idle" })
    },

    selectSquare: (square) => {
      const state = get()
      if (state.status !== "playing" || !state.color) return

      try {
        if (state.selectedSquare === null) {
          const chess = new Chess(state.fen)
          const rawMoves = chess.moves({ square: square as any, verbose: true }) as any[]
          if (rawMoves.length === 0) return

          const isMyPiece = state.color === "white"
            ? rawMoves[0].color === "w"
            : rawMoves[0].color === "b"
          if (!isMyPiece) return

          set({
            selectedSquare: square,
            validMoves: rawMoves.map((m: any) => m.to),
          })
          return
        }

        if (state.selectedSquare === square) {
          set({ selectedSquare: null, validMoves: [] })
          return
        }

        if (!state.validMoves.includes(square)) {
          const chess = new Chess(state.fen)
          const clickMoves = chess.moves({ square: square as any, verbose: true }) as any[]
          if (clickMoves.length > 0) {
            const isMyPiece = state.color === "white"
              ? clickMoves[0].color === "w"
              : clickMoves[0].color === "b"
            if (isMyPiece) {
              set({ selectedSquare: square, validMoves: clickMoves.map((m: any) => m.to) })
              return
            }
          }
          set({ selectedSquare: null, validMoves: [] })
          return
        }

        socket.emit("game:move", { gameId: state.gameId, from: state.selectedSquare, to: square })
        set({ selectedSquare: null, validMoves: [] })
      } catch (err) {
        console.error("selectSquare error:", err)
        set({ selectedSquare: null, validMoves: [] })
      }
    },

    resign: () => {
      socket.emit("game:resign", { gameId: get().gameId })
    },

    offerDraw: () => {
      socket.emit("game:draw-offer", { gameId: get().gameId })
    },

    respondDraw: (accept) => {
      socket.emit("game:draw-response", { gameId: get().gameId, accept })
      set({ drawOffered: false })
    },

    createRoom: (timeControl) => {
      connectSocket()
      socket.emit("game:create-room", { timeControl })
    },

    joinRoom: (code) => {
      connectSocket()
      socket.emit("game:join-room", { roomCode: code.toUpperCase() })
    },

    reset: () => {
      set({
        gameId: null, color: null, status: "idle", fen: INITIAL_FEN,
        clock: { white: 0, black: 0 }, moves: [], result: null, reason: null,
        roomCode: null, drawOffered: false, selectedSquare: null, validMoves: [],
        lastMove: null, opponent: null,
      })
    },
  }
})
