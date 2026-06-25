import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { createSyncJob } from "@/server/repositories/sync-repository"
import { deepSyncRecentMatches, DEEP_SYNC_QUEUES } from "@/server/valorant/matches/deep-sync"

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { queues?: unknown; maxDetailsPerQueue?: unknown; maxTotalDetails?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }

  const queues = Array.isArray(body.queues)
    ? body.queues.filter((q): q is string => typeof q === "string" && DEEP_SYNC_QUEUES.includes(q))
    : undefined
  const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : undefined)

  // Best-effort progress record; never blocks the scan.
  await createSyncJob(session.userId, session.puuid, "deep-sync").catch(() => null)

  // PUUID always from the session, never the client.
  const result = await deepSyncRecentMatches({
    userId: session.userId,
    puuid: session.puuid,
    queues: queues?.length ? queues : undefined,
    maxDetailsPerQueue: num(body.maxDetailsPerQueue),
    maxTotalDetails: num(body.maxTotalDetails),
  })
  return NextResponse.json(result)
}
