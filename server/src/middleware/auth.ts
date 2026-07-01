import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { Socket } from "socket.io"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"

export interface AuthPayload {
  userId?: string
  guestId?: string
  type: "user" | "guest"
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return next()
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload
    req.auth = payload
  } catch {
    // token inválido — segue sem auth
  }

  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Autenticação necessária" })
  }
  next()
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token
  if (!token) {
    socket.data.auth = null
    return next()
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    socket.data.auth = payload
  } catch {
    socket.data.auth = null
  }

  next()
}
