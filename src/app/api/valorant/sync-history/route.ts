import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { syncValorantMatchHistory, type SyncMode } from "@/server/valorant/matches/sync-history"

const MODES: SyncMode[] = ["recent", "extended", "all_available"]
const MAX_NEW_LIMIT = 200

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { mode?: unknown; maxNewMatches?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine — defaults to "recent"
  }

  const mode: SyncMode = MODES.includes(body.mode as SyncMode) ? (body.mode as SyncMode) : "recent"
  const maxNewMatches =
    typeof body.maxNewMatches === "number" && body.maxNewMatches > 0
      ? Math.min(body.maxNewMatches, MAX_NEW_LIMIT)
      : undefined

  // PUUID always comes from the session, never from the client.
  const result = await syncValorantMatchHistory({ userId: session.userId, puuid: session.puuid, mode, maxNewMatches })
  return NextResponse.json(result)
}
