import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { createSyncJob } from "@/server/repositories/sync-repository"
import { deepSyncRecentMatches } from "@/server/valorant/matches/deep-sync"

const MAX_DETAILS_LIMIT = 60

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { maxDetails?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }
  const maxDetails =
    typeof body.maxDetails === "number" && body.maxDetails > 0
      ? Math.min(body.maxDetails, MAX_DETAILS_LIMIT)
      : undefined

  // Best-effort progress record; never blocks the scan.
  await createSyncJob(session.userId, session.puuid, "deep-sync").catch(() => null)

  // PUUID always from the session, never the client.
  const result = await deepSyncRecentMatches({ userId: session.userId, puuid: session.puuid, maxDetails })
  return NextResponse.json(result)
}
