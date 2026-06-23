import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { bustMatchesCache } from "@/integrations/riot/real-adapter"
import { getCurrentSession } from "@/server/auth/session"
import { createSyncJob } from "@/server/repositories/sync-repository"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.redirect(new URL("/login", env.appUrl))
  }
  await createSyncJob(session.userId, session.puuid, "manual")
  return NextResponse.redirect(new URL("/settings?sync=queued", env.appUrl))
}

// Sync button (client) — drop the cached matches so the next render refetches.
export async function POST() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  bustMatchesCache(session.puuid)
  return NextResponse.json({ ok: true })
}
