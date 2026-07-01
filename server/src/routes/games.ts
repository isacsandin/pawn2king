import { Router, Request, Response } from "express"
import { prisma } from "../config/database"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.auth!.userId
    const page = Number(req.query.page as string) || 1
    const limit = Number(req.query.limit as string) || 20

    const where = {
      OR: [{ whiteId: userId }, { blackId: userId }],
      NOT: { status: "WAITING" as any },
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          white: { select: { id: true, nickname: true } },
          black: { select: { id: true, nickname: true } },
        },
      }),
      prisma.game.count({ where }),
    ])

    res.json({
      games: games.map((g) => ({
        id: g.id,
        white: g.white,
        black: g.black,
        result: g.result,
        status: g.status,
        timeControl: g.timeControl,
        pgn: g.pgn,
        playedAt: g.createdAt,
        userId,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const gameId = req.params.id as string
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        white: { select: { id: true, nickname: true } },
        black: { select: { id: true, nickname: true } },
        moves: { orderBy: { moveNumber: "asc" } },
      },
    })

    if (!game) return res.status(404).json({ error: "Partida não encontrada" })
    res.json(game)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get("/:id/pgn", async (req: Request, res: Response) => {
  try {
    const pgnId = req.params.id as string
    const game = await prisma.game.findUnique({ where: { id: pgnId } })
    if (!game || !game.pgn) return res.status(404).json({ error: "PGN não encontrado" })

    res.setHeader("Content-Type", "text/plain")
    res.send(game.pgn)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
