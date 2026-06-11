import { NextRequest, NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { normalizeRiotApiError } from "@/integrations/riot/client"
import { mapRiotMatchToPerformance } from "@/integrations/riot/mapper"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import type { MatchPerformance } from "@/types/domain"
import type { RiotMatchDto } from "@/types/riot"

function isRiotMatchDto(value: unknown): value is RiotMatchDto {
  return Boolean(value && typeof value === "object" && "matchInfo" in value && "players" in value)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { matchId } = await params

  try {
    let normalized: MatchPerformance | null = null

    if (env.enableMockRiot) {
      const mockMatches = await riotAdapter.getNormalizedMatches(session.puuid)
      normalized = mockMatches.find((match) => match.matchId === matchId) ?? null
    } else {
      const match = await riotAdapter.getMatchById(matchId)

      if (!isRiotMatchDto(match)) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 })
      }

      const participates = match.players.some((player) => player.puuid === session.puuid)
      if (!participates) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      normalized = mapRiotMatchToPerformance(match, session.puuid)
    }

    if (!normalized) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({
      authenticated: true,
      account: {
        puuid: session.puuid,
        gameName: session.gameName,
        tagLine: session.tagLine,
      },
      match: normalized,
    })
  } catch (error) {
    const normalized = normalizeRiotApiError(error)
    return NextResponse.json(
      {
        error: normalized.code,
        message: normalized.status === 429 ? "Riot rate limit reached. Retry shortly." : "Failed to fetch Riot match detail.",
      },
      { status: normalized.status },
    )
  }
}