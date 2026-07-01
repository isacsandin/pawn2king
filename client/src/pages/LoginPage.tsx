import { useState } from "react"
import { useAuthStore } from "../stores/auth"

interface LoginPageProps {
  onNavigate: (page: "lobby") => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [tab, setTab] = useState<"login" | "register" | "guest">("login")
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const { login, register, loginAsGuest } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (tab === "register") {
        await register(nickname, email, password)
      } else if (tab === "guest") {
        await loginAsGuest(nickname)
      } else {
        await login(email, password)
      }
      onNavigate("lobby")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-amber-400 mb-8">Pawn2King</h1>

        <div className="flex mb-6 bg-zinc-800 rounded-lg p-1">
          {(["login", "register", "guest"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError("") }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-amber-500 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t === "login" ? "Entrar" : t === "register" ? "Cadastrar" : "Convidado"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "guest" ? (
            <input
              type="text"
              placeholder="Seu nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none text-zinc-100"
              required
            />
          ) : (
            <>
              {tab === "register" && (
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none text-zinc-100"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none text-zinc-100"
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus:border-amber-500 outline-none text-zinc-100"
                required
              />
            </>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold rounded-lg transition-colors"
          >
            {tab === "login" ? "Entrar" : tab === "register" ? "Criar Conta" : "Jogar como Convidado"}
          </button>
        </form>
      </div>
    </div>
  )
}
