import { NextResponse } from "next/server"

import { env } from "@/lib/env"
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
