import Redis from "ioredis"

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
})

interface QueueEntry {
  socketId: string
  userId: string
  rating: number
  timeControl: string
  joinedAt: number
}

const QUEUE_PREFIX = "matchmaking:queue"

export async function joinQueue(entry: QueueEntry) {
  await redis.zadd(QUEUE_PREFIX + ":" + entry.timeControl, entry.rating, JSON.stringify(entry))
}

export async function leaveQueue(socketId: string) {
  const keys = await redis.keys(QUEUE_PREFIX + ":*")
  for (const key of keys) {
    const entries = await redis.zrange(key, 0, -1)
    for (const raw of entries) {
      const entry: QueueEntry = JSON.parse(raw)
      if (entry.socketId === socketId) {
        await redis.zrem(key, raw)
      }
    }
  }
}

export async function findMatch(socketId: string, timeControl: string, rating: number): Promise<QueueEntry | null> {
  const key = QUEUE_PREFIX + ":" + timeControl
  const entries = await redis.zrange(key, 0, -1)

  for (const raw of entries) {
    const entry: QueueEntry = JSON.parse(raw)
    if (entry.socketId === socketId) continue

    const ratingDiff = Math.abs(entry.rating - rating)
    const waitTime = Date.now() - entry.joinedAt
    const tolerance = 100 + Math.floor(waitTime / 10000) * 25

    if (ratingDiff <= Math.min(tolerance, 400)) {
      await redis.zrem(key, raw)
      return entry
    }
  }

  return null
}

export async function getQueuePosition(socketId: string, timeControl: string): Promise<number> {
  const key = QUEUE_PREFIX + ":" + timeControl
  const entries = await redis.zrange(key, 0, -1)
  for (let i = 0; i < entries.length; i++) {
    const entry: QueueEntry = JSON.parse(entries[i])
    if (entry.socketId === socketId) return i + 1
  }
  return 0
}
