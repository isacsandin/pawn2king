import "dotenv/config"
import express from "express"
import http from "http"
import cors from "cors"
import helmet from "helmet"
import { Server } from "socket.io"
import { authMiddleware, socketAuthMiddleware } from "./middleware/auth"
import authRoutes from "./routes/auth"
import gamesRoutes from "./routes/games"
import { registerGameHandlers } from "./sockets/gameHandler"

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
})

io.use(socketAuthMiddleware)

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(authMiddleware)

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.use("/api/auth", authRoutes)
app.use("/api/games", gamesRoutes)

registerGameHandlers(io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Pawn2King server running on port ${PORT}`)
})
