import { create } from "zustand"
import type { User } from "../types/auth"
import { api } from "../services/api"

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean

  login: (email: string, password: string) => Promise<void>
  register: (nickname: string, email: string, password: string) => Promise<void>
  loginAsGuest: (nickname: string) => Promise<void>
  logout: () => void
  loadSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: true,

  login: async (email, password) => {
    const { token, user } = await api.login({ email, password })
    localStorage.setItem("token", token)
    set({ token, user })
  },

  register: async (nickname, email, password) => {
    const { token, user } = await api.register({ nickname, email, password })
    localStorage.setItem("token", token)
    set({ token, user })
  },

  loginAsGuest: async (nickname) => {
    const { token, guest } = await api.guest({ nickname })
    localStorage.setItem("token", token)
    set({ token, user: { ...guest, rating: null } })
  },

  logout: () => {
    localStorage.removeItem("token")
    set({ token: null, user: null })
  },

  loadSession: async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const { user } = await api.me()
      set({ user, loading: false })
    } catch {
      localStorage.removeItem("token")
      set({ token: null, user: null, loading: false })
    }
  },
}))
