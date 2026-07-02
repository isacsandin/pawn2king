import { useEffect, useState } from "react"
import { useGameStore } from "../stores/game"
import { ChessBoard } from "../components/ChessBoard"
import { Clock } from "../components/Clock"
import { MoveList } from "../components/MoveList"
import { getPieceSvg } from "../components/ChessBoard/Piece"

interface GamePageProps {
  onBack: () => void
}

export function GamePage({ onBack }: GamePageProps) {
  const {
    fen, color, clock, status, moves, selectedSquare, validMoves,
    lastMove, opponent, drawOffered, result, reason, pendingPromotion,
    selectSquare, selectPromotion, resign, offerDraw, respondDraw, reset,
  } = useGameStore()

  const [localClock, setLocalClock] = useState(clock)

  useEffect(() => {
    setLocalClock(clock)
  }, [clock])

  useEffect(() => {
    if (status !== "playing") return
    const interval = setInterval(() => {
      setLocalClock((prev) => ({
        white: Math.max(0, prev.white - 100),
        black: Math.max(0, prev.black - 100),
      }))
    }, 100)
    return () => clearInterval(interval)
  }, [status])

  const myClock = color === "white" ? localClock.white : localClock.black
  const oppClock = color === "white" ? localClock.black : localClock.white

  if (status === "over") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="bg-zinc-800 rounded-xl p-8 text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-2">
            {result === "1-0" && (color === "white" ? "Você venceu!" : "Derrota")}
            {result === "0-1" && (color === "black" ? "Você venceu!" : "Derrota")}
            {result === "½-½" && "Empate!"}
          </h2>
          <p className="text-zinc-400 mb-6">{reason}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { reset(); onBack() }}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
            >
              Voltar ao Lobby
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4">
      {drawOffered && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 text-center">
            <p className="mb-4">Oponente ofereceu empate</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => respondDraw(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg">Aceitar</button>
              <button onClick={() => respondDraw(false)} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg">Recusar</button>
            </div>
          </div>
        </div>
      )}

      {pendingPromotion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-xl p-6 text-center">
            <p className="mb-4 text-zinc-200">Promoção de peão</p>
            <div className="flex gap-3 justify-center">
              {["q", "r", "b", "n"].map((piece) => {
                const p = color === "white" ? piece.toUpperCase() : piece
                return (
                  <button
                    key={piece}
                    onClick={() => selectPromotion(p)}
                    className="w-16 h-16 bg-zinc-700 hover:bg-zinc-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <span className="w-12 h-12">{getPieceSvg(p)}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          ← Voltar
        </button>
        {opponent && <span className="text-zinc-400 text-sm">vs {opponent.nickname}</span>}
        <div />
      </header>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Clock time={oppClock} label={color === "white" ? "Pretas" : "Brancas"} active={color !== "white"} />
          <ChessBoard
            fen={fen}
            orientation={color || "white"}
            selected={selectedSquare}
            validMoves={validMoves}
            lastMove={lastMove}
            onSquareClick={selectSquare}
          />
          <Clock time={myClock} label={color === "white" ? "Brancas" : "Pretas"} active={color === "white"} />
        </div>

        <div className="w-full lg:w-64 space-y-3">
          <MoveList moves={moves} />

          <div className="flex gap-2">
            <button onClick={resign} className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm transition-colors">
              Desistir
            </button>
            <button onClick={offerDraw} className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
              Oferecer Empate
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
