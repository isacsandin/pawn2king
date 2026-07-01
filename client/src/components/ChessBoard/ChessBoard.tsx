import { useCallback, useRef, useState } from "react"
import { getPieceSvg } from "./Piece"
import { FILES, RANKS } from "./pieces"

interface ChessBoardProps {
  fen: string
  orientation?: "white" | "black"
  selected?: string | null
  validMoves?: string[]
  onSquareClick?: (square: string) => void
  lastMove?: [string, string] | null
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
  const boardRef = useRef<HTMLDivElement>(null)
  const [dragPiece, setDragPiece] = useState<{ square: string; x: number; y: number } | null>(null)

  const getSquare = useCallback(
    (file: number, rank: number): string => {
      const f = isWhite ? file : 7 - file
      const r = isWhite ? rank : 7 - rank
      return `${FILES[f]}${RANKS[r]}`
    },
    [isWhite]
  )

  const isSelected = useCallback(
    (file: number, rank: number) => selected === getSquare(file, rank),
    [selected, getSquare]
  )

  const isValidMove = useCallback(
    (file: number, rank: number) => validMoves.includes(getSquare(file, rank)),
    [validMoves, getSquare]
  )

  const isLastMove = useCallback(
    (file: number, rank: number) => {
      const sq = getSquare(file, rank)
      return lastMove ? sq === lastMove[0] || sq === lastMove[1] : false
    },
    [lastMove, getSquare]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent, square: string) => {
      e.dataTransfer.setData("text/plain", square)
      e.dataTransfer.effectAllowed = "move"
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setDragPiece({ square, x: e.clientX - rect.left, y: e.clientY - rect.top })
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetSquare: string) => {
      e.preventDefault()
      const fromSquare = e.dataTransfer.getData("text/plain")
      if (fromSquare && fromSquare !== targetSquare) {
        onSquareClick?.(fromSquare)
        setTimeout(() => onSquareClick?.(targetSquare), 10)
      }
      setDragPiece(null)
    },
    [onSquareClick]
  )

  const handleDragEnd = useCallback(() => {
    setDragPiece(null)
  }, [])

  return (
    <div
      ref={boardRef}
      className="inline-grid grid-cols-8 border-2 border-zinc-600 rounded-sm overflow-hidden select-none"
      onDragOver={handleDragOver}
    >
      {RANKS.map((_, rankIdx) =>
        FILES.map((_, fileIdx) => {
          const f = isWhite ? fileIdx : 7 - fileIdx
          const r = isWhite ? rankIdx : 7 - rankIdx
          const piece = board[r][f]
          const isLight = (fileIdx + rankIdx) % 2 === 0
          const sq = getSquare(fileIdx, rankIdx)
          const isDragging = dragPiece?.square === sq

          return (
            <div
              key={`${fileIdx}-${rankIdx}`}
              onClick={() => {
                if (!isDragging) onSquareClick?.(sq)
              }}
              onDrop={(e) => handleDrop(e, sq)}
              onDragOver={handleDragOver}
              className={`
                w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                flex items-center justify-center p-1
                transition-colors relative cursor-pointer
                ${isLight ? "bg-amber-100" : "bg-amber-700"}
                ${isSelected(fileIdx, rankIdx) ? "ring-2 ring-amber-300 ring-inset" : ""}
                ${isLastMove(fileIdx, rankIdx) ? (isLight ? "bg-amber-300/60" : "bg-amber-600/60") : ""}
                hover:brightness-110
              `}
            >
              {isValidMove(fileIdx, rankIdx) && (
                <span
                  className={`absolute rounded-full ${
                    piece
                      ? "w-5 h-5 border-4 border-zinc-600/40"
                      : "w-3 h-3 bg-zinc-600/40"
                  }`}
                />
              )}
              {piece && (
                <span
                  draggable
                  onDragStart={(e) => handleDragStart(e, sq)}
                  onDragEnd={handleDragEnd}
                  className={`pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center w-full h-full ${
                    isDragging ? "opacity-40" : ""
                  } ${
                    piece === piece.toUpperCase()
                      ? "drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
                      : ""
                  }`}
                >
                  {getPieceSvg(piece)}
                </span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
