const API_URL = "/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Erro desconhecido" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  register: (data: { nickname: string; email: string; password: string }) =>
    request<{ token: string; user: { id: string; nickname: string; rating: number } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; nickname: string; rating: number } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  guest: (data: { nickname: string }) =>
    request<{ token: string; guest: { id: string; nickname: string } }>("/auth/guest", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<{ user: { id: string; nickname: string; rating: number | null } }>("/auth/me"),

  history: (page = 1) =>
    request<{ games: any[]; total: number; page: number; totalPages: number }>(`/games?page=${page}&limit=20`),

  gameDetail: (id: string) => request<any>(`/games/${id}`),

  pgn: (id: string) => request<string>(`/games/${id}/pgn`),
}
