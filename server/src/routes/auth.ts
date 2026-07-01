import { Router, Request, Response } from "express"
import { register, login, createGuest } from "../services/auth"
import { prisma } from "../config/database"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { nickname, email, password } = req.body
    if (!nickname || !email || !password) {
      return res.status(400).json({ error: "nickname, email e password são obrigatórios" })
    }
    const result = await register(nickname, email, password)
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "email e password são obrigatórios" })
    }
    const result = await login(email, password)
    res.json(result)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
})

router.post("/guest", async (req: Request, res: Response) => {
  try {
    const { nickname } = req.body
    if (!nickname) {
      return res.status(400).json({ error: "nickname é obrigatório" })
    }
    const result = await createGuest(nickname)
    res.status(201).json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    if (req.auth!.type === "guest") {
      const guest = await prisma.guest.findUnique({ where: { id: req.auth!.guestId } })
      if (!guest) return res.status(404).json({ error: "Convidado não encontrado" })
      return res.json({ user: { id: guest.id, nickname: guest.nickname, rating: null } })
    }

    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" })
    res.json({
      user: { id: user.id, nickname: user.nickname, rating: user.rating },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
