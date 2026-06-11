import { NextRequest, NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { normalizeRiotApiError } from "@/integrations/riot/client"
import { getCurrentSession } from "@/server/auth/session"

export async function GET(request: NextRequest) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limitParam = request.nextUrl.searchParams.get("limit")
  const parsedLimit = limitParam ? Number(limitParam) : Number.NaN
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 25) : 10

  try {
    // Security: always resolve matches from the authenticated session PUUID.
    const matches = await riotAdapter.getNormalizedMatches(session.puuid, limit)

    return NextResponse.json({
      authenticated: true,
      account: {
        puuid: session.puuid,
        gameName: session.gameName,
        tagLine: session.tagLine,
      },
      matches,
    })
  } catch (error) {
    const normalized = normalizeRiotApiError(error)
    return NextResponse.json(
      {
        error: "riot_match_fetch_failed",
        status: normalized.status,
        message: "Could not load Valorant matches from Riot API.",
      },
      { status: normalized.status },
    )
  }
}