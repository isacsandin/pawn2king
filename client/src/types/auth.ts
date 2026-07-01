export interface User {
  id: string
  nickname: string
  rating: number | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface GuestResponse {
  token: string
  guest: User
}
