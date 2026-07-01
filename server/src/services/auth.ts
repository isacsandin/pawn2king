import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "../config/database"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"
const SALT_ROUNDS = 10

export async function register(nickname: string, email: string, password: string) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname }] },
  })
  if (existing) {
    throw new Error(existing.email === email ? "Email já cadastrado" : "Nickname já em uso")
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: { nickname, email, password: passwordHash },
  })

  const token = jwt.sign({ userId: user.id, type: "user" }, JWT_SECRET, { expiresIn: "7d" })
  return { token, user: { id: user.id, nickname: user.nickname, rating: user.rating } }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error("Email ou senha inválidos")

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error("Email ou senha inválidos")

  const token = jwt.sign({ userId: user.id, type: "user" }, JWT_SECRET, { expiresIn: "7d" })
  return { token, user: { id: user.id, nickname: user.nickname, rating: user.rating } }
}

export async function createGuest(nickname: string) {
  const guest = await prisma.guest.create({
    data: {
      nickname,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const token = jwt.sign({ guestId: guest.id, type: "guest" }, JWT_SECRET, { expiresIn: "1d" })
  return { token, guest: { id: guest.id, nickname: guest.nickname } }
}
