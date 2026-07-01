import { useEffect, useState } from "react"
import { useAuthStore } from "./stores/auth"
import { useGameStore } from "./stores/game"
import { LoginPage } from "./pages/LoginPage"
import { LobbyPage } from "./pages/LobbyPage"
import { GamePage } from "./pages/GamePage"
import { HistoryPage } from "./pages/HistoryPage"
import { AnalysisPage } from "./pages/AnalysisPage"

type Page = "login" | "lobby" | "game" | "history" | "analysis"

function App() {
  const [page, setPage] = useState<Page>("login")
  const [analysisGameId, setAnalysisGameId] = useState<string | null>(null)
  const { user, loading, loadSession } = useAuthStore()
  const { status } = useGameStore()

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) setPage("login")
    else if (page === "login") setPage("lobby")
  }, [user, loading])

  useEffect(() => {
    if (status === "playing" || status === "over") setPage("game")
  }, [status])

  const goToHistory = () => setPage("history")
  const goToAnalysis = (gameId: string) => {
    setAnalysisGameId(gameId)
    setPage("analysis")
  }
  const goToLobby = () => setPage("lobby")

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Carregando...</p>
      </div>
    )
  }

  if (page === "login") return <LoginPage onNavigate={() => setPage("lobby")} />
  if (page === "game") return <GamePage onBack={goToLobby} />
  if (page === "history") return <HistoryPage onBack={goToLobby} onViewGame={goToAnalysis} />
  if (page === "analysis" && analysisGameId) return <AnalysisPage gameId={analysisGameId} onBack={goToHistory} />
  return <LobbyPage onStartGame={() => setPage("game")} onViewHistory={goToHistory} />
}

export default App
