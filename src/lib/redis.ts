import { Redis } from "@upstash/redis"

import { env } from "@/lib/env"

let redis: Redis | null | undefined

export function getRedis() {
  if (redis !== undefined) {
    return redis
  }

  if (!env.upstashUrl || !env.upstashToken) {
    redis = null
    return redis
  }

  redis = new Redis({
    url: env.upstashUrl,
    token: env.upstashToken,
  })

  return redis
}
