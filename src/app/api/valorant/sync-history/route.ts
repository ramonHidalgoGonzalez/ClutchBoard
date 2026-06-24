import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import {
  shouldAutoSync,
  syncValorantMatchHistory,
  type SyncMode,
} from "@/server/valorant/matches/sync-history"

const MODES: SyncMode[] = ["recent", "extended", "all_available"]
const MAX_NEW_LIMIT = 200

// Per-instance cooldown for automatic background syncs (manual syncs ignore it).
const lastAutoSync = new Map<string, number>()

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { mode?: unknown; maxNewMatches?: unknown; auto?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine — defaults to "recent"
  }

  const auto = body.auto === true
  if (auto) {
    if (!shouldAutoSync(lastAutoSync.get(session.puuid), Date.now())) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    lastAutoSync.set(session.puuid, Date.now())
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
