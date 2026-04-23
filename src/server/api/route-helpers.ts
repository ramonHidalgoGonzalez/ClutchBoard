import { NextResponse } from "next/server"

import { getLogger } from "@/lib/logger"
import { enforceRateLimit } from "@/lib/ratelimit"

export async function withApiProtection<T>(
  key: string,
  handler: () => Promise<T>,
) {
  const limit = await enforceRateLimit(key)
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    return NextResponse.json(await handler())
  } catch (error) {
    getLogger().error({ err: error }, "API route failed")
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    )
  }
}
