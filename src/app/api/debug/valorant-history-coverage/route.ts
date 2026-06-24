import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { getHistoryCoverage } from "@/server/services/analytics-service"

/**
 * Internal coverage diagnostic. Session-gated, reads only the caller's own
 * synced history, and returns no tokens/secrets — just counts and dates.
 */
export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const coverage = await getHistoryCoverage(session.puuid)
  return NextResponse.json(coverage)
}
