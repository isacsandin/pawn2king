import { useState } from "react"
import { useAuthStore } from "../stores/auth"
import { useGameStore } from "../stores/game"

interface LobbyPageProps {
  onStartGame: () => void
  onViewHistory: () => void
}

const TIME_CONTROLS = [
  { id: "BLITZ_3_0", label: "Blitz 3+0", desc: "3 min" },
  { id: "BLITZ_5_0", label: "Blitz 5+0", desc: "5 min" },
  { id: "RAPID_10_0", label: "Rápido 10+0", desc: "10 min" },
  { id: "RAPID_15_10", label: "Rápido 15+10", desc: "15 min +10s" },
  { id: "CLASSIC_30_0", label: "Clássico 30+0", desc: "30 min" },
]

export function LobbyPage({ onStartGame, onViewHistory }: LobbyPageProps) {
  const { user, logout } = useAuthStore()
  const { status, joinMatchmaking, leaveMatchmaking, createRoom, joinRoom, roomCode, reset } = useGameStore()
  const [selectedTC, setSelectedTC] = useState("BLITZ_5_0")
  const [roomInput, setRoomInput] = useState("")

  const handleQuickPlay = () => {
    joinMatchmaking(selectedTC)
  }

  const handleCreateRoom = () => {
    createRoom(selectedTC)
  }

  const handleJoinRoom = () => {
    if (roomInput.trim()) joinRoom(roomInput.trim())
  }

  const handleCancel = () => {
    leaveMatchmaking()
  }

  const handleBackFromGame = () => {
    reset()
    onStartGame()
  }

  if (status === "searching") {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-xl text-zinc-100 mb-2">Buscando oponente...</p>
          <p className="text-zinc-500 mb-6">Procurando jogador para {TIME_CONTROLS.find(t => t.id === selectedTC)?.label}</p>
          <button onClick={handleCancel} className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  if (roomCode) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-400 mb-2">Compartilhe o código da sala:</p>
          <p className="text-4xl font-bold text-amber-400 tracking-widest mb-6">{roomCode}</p>
          <p className="text-zinc-500 text-sm mb-4">Aguardando oponente entrar...</p>
          <button
            onClick={() => { reset(); handleBackFromGame() }}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6">
      <header className="flex items-center justify-between mb-8 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-amber-400">Pawn2King</h1>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">
            {user?.nickname}
            {user?.rating != null && <span className="text-amber-400 ml-1">({user.rating})</span>}
          </span>
          <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto mt-8 space-y-6">
        <div>
          <p className="text-sm text-zinc-500 mb-3">Controle de tempo</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.id}
                onClick={() => setSelectedTC(tc.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedTC === tc.id
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                }`}
              >
                <div className="font-medium text-sm">{tc.label}</div>
                <div className="text-xs text-zinc-500">{tc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleQuickPlay}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg text-lg transition-colors"
        >
          Jogar Rápido
        </button>

        <div className="flex gap-2">
          <button
            onClick={onViewHistory}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg font-medium transition-colors"
          >
            Histórico
          </button>
        </div>

        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={handleCreateRoom}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg font-medium transition-colors mb-3"
          >
            Criar Sala Privada
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código da sala"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none text-zinc-100 uppercase tracking-widest"
            />
            <button
              onClick={handleJoinRoom}
              disabled={roomInput.length < 6}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
