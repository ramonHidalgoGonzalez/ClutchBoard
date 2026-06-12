import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { getCoachInsights } from "@/server/services/coach-service"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const insights = await getCoachInsights(session.puuid)
  return NextResponse.json({ insights })
}
