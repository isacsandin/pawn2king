import { useEffect, useState } from "react"
import { api } from "../services/api"

interface GameSummary {
  id: string
  white: { id: string; nickname: string } | null
  black: { id: string; nickname: string } | null
  result: string
  timeControl: string
  playedAt: string
  userId: string
}

interface HistoryPageProps {
  onBack: () => void
  onViewGame: (gameId: string) => void
}

const TC_LABELS: Record<string, string> = {
  BLITZ_3_0: "3+0", BLITZ_5_0: "5+0", RAPID_10_0: "10+0",
  RAPID_15_10: "15+10", CLASSIC_30_0: "30+0",
}

export function HistoryPage({ onBack, onViewGame }: HistoryPageProps) {
  const [games, setGames] = useState<GameSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const data = await api.history(page)
        setGames(data.games)
        setTotalPages(data.totalPages)
      } catch (err) {
        console.error("Failed to load history", err)
      }
      setLoading(false)
    })()
  }, [page])

  const getResultText = (game: GameSummary) => {
    if (game.result === "1-0") return game.userId === game.white?.id ? "Vitória" : "Derrota"
    if (game.result === "0-1") return game.userId === game.black?.id ? "Vitória" : "Derrota"
    return "Empate"
  }

  const getResultColor = (game: GameSummary) => {
    const text = getResultText(game)
    if (text === "Vitória") return "text-emerald-400"
    if (text === "Derrota") return "text-red-400"
    return "text-yellow-400"
  }

  const getOpponent = (game: GameSummary) => {
    if (game.userId === game.white?.id) return game.black?.nickname || "?"
    return game.white?.nickname || "?"
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6">
      <header className="flex items-center gap-4 mb-6 max-w-lg mx-auto">
        <button onClick={onBack} className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold">Histórico</h1>
      </header>

      <div className="max-w-lg mx-auto space-y-2">
        {loading && <p className="text-zinc-500 text-center py-8">Carregando...</p>}

        {!loading && games.length === 0 && (
          <p className="text-zinc-500 text-center py-8">Nenhuma partida ainda</p>
        )}

        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => onViewGame(g.id)}
            className="w-full flex items-center justify-between p-4 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors text-left"
          >
            <div>
              <div className="font-medium">{getOpponent(g)}</div>
              <div className="text-xs text-zinc-500">
                {TC_LABELS[g.timeControl] || g.timeControl} • {new Date(g.playedAt).toLocaleDateString()}
              </div>
            </div>
            <span className={`font-semibold ${getResultColor(g)}`}>{getResultText(g)}</span>
          </button>
        ))}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 bg-zinc-800 rounded-lg disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-zinc-500">{page}/{totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-zinc-800 rounded-lg disabled:opacity-30 transition-colors"
            >
              Próximo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
