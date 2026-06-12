import { NextRequest, NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { getAnalyticsPayload } from "@/server/services/analytics-service"

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const periodDays = Number(request.nextUrl.searchParams.get("periodDays") ?? "60")
  const queue = request.nextUrl.searchParams.get("queue") ?? undefined

  const analytics = await getAnalyticsPayload(session.puuid, {
    periodDays: Number.isFinite(periodDays) ? Math.max(7, Math.min(periodDays, 180)) : 60,
    queue,
  })

  return NextResponse.json(analytics)
}
