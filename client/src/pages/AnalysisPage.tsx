import { useEffect, useState, useCallback } from "react"
import { Chess } from "chess.js"
import { ChessBoard } from "../components/ChessBoard"
import { api } from "../services/api"

interface MoveData {
  id: string
  moveNumber: number
  from: string
  to: string
  san: string
  fen: string
  promotion: string | null
}

interface GameDetail {
  id: string
  white: { nickname: string }
  black: { nickname: string }
  result: string
  moves: MoveData[]
}

interface AnalysisPageProps {
  gameId: string
  onBack: () => void
}

export function AnalysisPage({ gameId, onBack }: AnalysisPageProps) {
  const [game, setGame] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMove, setCurrentMove] = useState(0)
  const [editorFen, setEditorFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  const [evalHistory, setEvalHistory] = useState<number[]>([])

  useEffect(() => {
    (async () => {
      try {
        const data = await api.gameDetail(gameId)
        setGame(data)
        computeEvalHistory(data.moves)
      } catch (err) {
        console.error("Failed to load game", err)
      }
      setLoading(false)
    })()
  }, [gameId])

  const computeEvalHistory = (moves: MoveData[]) => {
    const chess = new Chess()
    const values: number[] = []
    for (const move of moves) {
      chess.move(move.san)
      const material = computeMaterial(chess.fen())
      values.push(material)
    }
    setEvalHistory(values)
  }

  useEffect(() => {
    if (!game || game.moves.length === 0) return
    const chess = new Chess()
    for (let i = 0; i < currentMove; i++) {
      chess.move(game.moves[i].san)
    }
    setEditorFen(chess.fen())
  }, [currentMove, game])

  const goToStart = useCallback(() => setCurrentMove(0), [])
  const goToEnd = useCallback(() => setCurrentMove(game?.moves.length || 0), [game])
  const goBack = useCallback(() => setCurrentMove((p) => Math.max(0, p - 1)), [])
  const goForward = useCallback(() => setCurrentMove((p) => Math.min(game?.moves.length || 0, p + 1)), [game])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Carregando análise...</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-red-400">Partida não encontrada</p>
      </div>
    )
  }

  const maxEval = Math.max(...evalHistory.map(Math.abs), 1)

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4">
      <header className="flex items-center justify-between mb-4 max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          ← Histórico
        </button>
        <div className="text-center">
          <span className="text-zinc-300">{game.white?.nickname}</span>
          <span className="text-zinc-500 mx-2">vs</span>
          <span className="text-zinc-300">{game.black?.nickname}</span>
        </div>
        <div className="text-amber-400 font-semibold text-sm">{game.result || "?"}</div>
      </header>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <ChessBoard fen={editorFen} lastMove={currentMove > 0 ? [game.moves[currentMove - 1]?.from || "", game.moves[currentMove - 1]?.to || ""] : null} />

          <div className="flex items-center gap-2">
            <button onClick={goToStart} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">⏮</button>
            <button onClick={goBack} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">◀</button>
            <span className="text-sm text-zinc-400 w-20 text-center">
              {currentMove}/{game.moves.length}
            </span>
            <button onClick={goForward} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">▶</button>
            <button onClick={goToEnd} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">⏭</button>
          </div>
        </div>

        <div className="w-full lg:w-72 space-y-3">
          <div className="bg-zinc-800 rounded-lg p-3">
            <h3 className="text-xs text-zinc-500 uppercase mb-2">Movimentos</h3>
            <div className="max-h-48 overflow-y-auto text-sm font-mono">
              {game.moves.length === 0 && <p className="text-zinc-500 text-center py-2">Nenhum movimento</p>}
              {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, i) => (
                <div key={i} className="flex gap-2 py-0.5">
                  <span className="text-zinc-500 w-6 text-right">{i + 1}.</span>
                  {[0, 1].map((offset) => {
                    const move = game.moves[i * 2 + offset]
                    if (!move) return <span key={offset} className="w-16" />
                    const isCurrent = i * 2 + offset + 1 === currentMove
                    return (
                      <button
                        key={offset}
                        onClick={() => setCurrentMove(i * 2 + offset + 1)}
                        className={`w-16 text-left rounded px-0.5 transition-colors ${
                          isCurrent ? "bg-amber-500/20 text-amber-300" : "hover:bg-zinc-700"
                        }`}
                      >
                        {move.san}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800 rounded-lg p-3">
            <h3 className="text-xs text-zinc-500 uppercase mb-2">Avaliação (material)</h3>
            <div className="h-32 flex items-end gap-px">
              {evalHistory.map((val, i) => {
                const height = Math.abs(val) / maxEval * 100
                const isWhite = val >= 0
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all ${
                      i + 1 === currentMove ? "opacity-100" : "opacity-60"
                    } ${isWhite ? "bg-zinc-300" : "bg-zinc-600"}`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`Move ${i + 1}: ${val > 0 ? "+" : ""}${val.toFixed(1)}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function computeMaterial(fen: string): number {
  const pieceValues: Record<string, number> = {
    p: 1, n: 3, b: 3, r: 5, q: 9,
    P: -1, N: -3, B: -3, R: -5, Q: -9,
  }
  let score = 0
  for (const ch of fen.split(" ")[0]) {
    score += pieceValues[ch] || 0
  }
  return score
}
