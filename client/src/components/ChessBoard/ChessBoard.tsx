import { useCallback } from "react"
import { getPieceChar, FILES, RANKS } from "./pieces"

interface ChessBoardProps {
  fen: string
  orientation?: "white" | "black"
  selected?: string | null
  validMoves?: string[]
  onSquareClick?: (square: string) => void
  lastMove?: [string, string] | null
  flipped?: boolean
}

function parseFen(fen: string): (string | null)[][] {
  const rows = fen.split(" ")[0].split("/")
  return rows.map((row) => {
    const squares: (string | null)[] = []
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < Number(ch); i++) squares.push(null)
      } else {
        squares.push(ch)
      }
    }
    return squares
  })
}

export function ChessBoard({
  fen,
  orientation = "white",
  selected,
  validMoves = [],
  onSquareClick,
  lastMove,
}: ChessBoardProps) {
  const board = parseFen(fen)
  const isWhite = orientation === "white"

  const getSquare = useCallback(
    (file: number, rank: number): string => {
      const f = isWhite ? file : 7 - file
      const r = isWhite ? rank : 7 - rank
      return `${FILES[f]}${RANKS[r]}`
    },
    [isWhite]
  )

  const isSelected = useCallback(
    (file: number, rank: number) => {
      return selected === getSquare(file, rank)
    },
    [selected, getSquare]
  )

  const isValidMove = useCallback(
    (file: number, rank: number) => {
      return validMoves.includes(getSquare(file, rank))
    },
    [validMoves, getSquare]
  )

  const isLastMove = useCallback(
    (file: number, rank: number) => {
      const sq = getSquare(file, rank)
      return lastMove ? sq === lastMove[0] || sq === lastMove[1] : false
    },
    [lastMove, getSquare]
  )

  return (
    <div className="inline-grid grid-cols-8 border-2 border-zinc-600 rounded-sm overflow-hidden">
      {RANKS.map((_, rankIdx) =>
        FILES.map((_, fileIdx) => {
          const f = isWhite ? fileIdx : 7 - fileIdx
          const r = isWhite ? rankIdx : 7 - rankIdx
          const piece = board[r][f]
          const isLight = (fileIdx + rankIdx) % 2 === 0
          const sq = getSquare(fileIdx, rankIdx)

          return (
            <button
              key={`${fileIdx}-${rankIdx}`}
              onClick={() => onSquareClick?.(sq)}
              className={`
                w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                flex items-center justify-center
                text-3xl sm:text-4xl leading-none
                transition-colors relative
                ${isLight ? "bg-amber-100" : "bg-amber-700"}
                ${isSelected(fileIdx, rankIdx) ? "ring-2 ring-amber-300 ring-inset" : ""}
                ${isLastMove(fileIdx, rankIdx) ? "bg-amber-400/40" : ""}
                hover:opacity-90
              `}
            >
              {isValidMove(fileIdx, rankIdx) && (
                <span
                  className={`absolute rounded-full ${
                    piece ? "w-5 h-5 border-4 border-zinc-600/40" : "w-3 h-3 bg-zinc-600/40"
                  }`}
                />
              )}
              {piece && (
                <span className={`pointer-events-none ${piece === piece.toUpperCase() ? "drop-shadow-sm" : ""}`}>
                  {getPieceChar(piece)}
                </span>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
