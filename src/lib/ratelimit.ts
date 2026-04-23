import { Ratelimit } from "@upstash/ratelimit"

import { getRedis } from "@/lib/redis"

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

export async function enforceRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const redis = getRedis()

  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.ceil(windowMs / 1000)} s`),
      analytics: true,
      prefix: "valorant-tracker",
    })

    return ratelimit.limit(key)
  }

  const now = Date.now()
  const bucket = memoryBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    const nextBucket = { count: 1, resetAt: now + windowMs }
    memoryBuckets.set(key, nextBucket)

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: nextBucket.resetAt,
      pending: Promise.resolve(),
    }
  }

  bucket.count += 1
  memoryBuckets.set(key, bucket)

  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
    pending: Promise.resolve(),
  }
}
