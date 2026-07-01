import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("token")
    socket = io({
      auth: { token },
      autoConnect: false,
      transports: ["websocket", "polling"],
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  if (!s.connected) s.connect()
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect()
}

export function updateSocketAuth() {
  const token = localStorage.getItem("token")
  if (socket) {
    socket.auth = { token }
    if (socket.connected) socket.disconnect().connect()
  }
}
