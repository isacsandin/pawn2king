import { Chess } from "chess.js"
import { prisma } from "../config/database"

export interface GameClock {
  white: number
  black: number
  increment: number
}

const TIME_CONTROLS: Record<string, { initial: number; increment: number }> = {
  BLITZ_3_0: { initial: 3 * 60 * 1000, increment: 0 },
  BLITZ_5_0: { initial: 5 * 60 * 1000, increment: 0 },
  RAPID_10_0: { initial: 10 * 60 * 1000, increment: 0 },
  RAPID_15_10: { initial: 15 * 60 * 1000, increment: 10 * 1000 },
  CLASSIC_30_0: { initial: 30 * 60 * 1000, increment: 0 },
}

export class GameService {
  private chess: Chess
  public gameId: string
  public whiteId: string
  public blackId: string
  public clock: GameClock
  public timeControl: string
  public turn: "w" | "b" = "w"
  public lastMoveTime: number = Date.now()
  public status: string = "ACTIVE"

  constructor(gameId: string, whiteId: string, blackId: string, timeControl: string) {
    this.chess = new Chess()
    this.gameId = gameId
    this.whiteId = whiteId
    this.blackId = blackId
    this.timeControl = timeControl
    const tc = TIME_CONTROLS[timeControl] || TIME_CONTROLS.BLITZ_5_0
    this.clock = { white: tc.initial, black: tc.initial, increment: tc.increment }
  }

  get fen() { return this.chess.fen() }
  get pgn() { return this.chess.pgn() }
  get history() { return this.chess.history({ verbose: true }) }
  get isGameOver() { return this.chess.isGameOver() }
  get isCheck() { return this.chess.isCheck() }
  get turnColor() { return this.chess.turn() }

  getValidMoves(square: string): string[] {
    return (this.chess.moves({ square: square as any, verbose: true }) as any[]).map((m) => m.to)
  }

  isPlayerTurn(playerId: string): boolean {
    const isWhite = playerId === this.whiteId
    return isWhite ? this.turnColor === "w" : this.turnColor === "b"
  }

  makeMove(from: string, to: string, promotion?: string) {
    const move = this.chess.move({ from, to, promotion })
    if (!move) return null
    return move
  }

  isDrawOfferAvailable(): boolean {
    return !this.isGameOver
  }

  getResult(): { result: string; reason: string } | null {
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === "w" ? "black" : "white"
      return { result: winner === "white" ? "1-0" : "0-1", reason: "Xeque-mate" }
    }
    if (this.chess.isStalemate()) return { result: "½-½", reason: "Afogamento" }
    if (this.chess.isDraw()) return { result: "½-½", reason: "Empate" }
    if (this.chess.isThreefoldRepetition()) return { result: "½-½", reason: "Repetição" }
    if (this.chess.isInsufficientMaterial()) return { result: "½-½", reason: "Material insuficiente" }
    return null
  }

  tick(deltaMs: number) {
    if (this.status !== "ACTIVE") return
    if (this.turnColor === "w") {
      this.clock.white = Math.max(0, this.clock.white - deltaMs)
      if (this.clock.white <= 0) {
        this.status = "TIME_BLACK"
        return "black"
      }
    } else {
      this.clock.black = Math.max(0, this.clock.black - deltaMs)
      if (this.clock.black <= 0) {
        this.status = "TIME_WHITE"
        return "white"
      }
    }
    return null
  }

  applyIncrement() {
    if (this.turnColor === "w") {
      this.clock.white += this.clock.increment
    } else {
      this.clock.black += this.clock.increment
    }
  }

  async saveMove(from: string, to: string, san: string, promotion?: string) {
    return prisma.move.create({
      data: {
        gameId: this.gameId,
        moveNumber: this.history.length,
        from,
        to,
        promotion: promotion || null,
        fen: this.fen,
        san,
        clockWhite: this.clock.white,
        clockBlack: this.clock.black,
      },
    })
  }
}
