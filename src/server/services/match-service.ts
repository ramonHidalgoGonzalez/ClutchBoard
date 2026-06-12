import { buildAgentBreakdown, buildMapBreakdown } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"
import { env } from "@/lib/env"
import { getAnalyticsPayload } from "@/server/services/analytics-service"
import type { RiotMatchDto } from "@/types/riot"

type MatchPlayerRow = {
  name: string
  teamId: string
  agentName: string
  agentImageUrl?: string | null
  agentIconUrl?: string | null
  kills: number
  deaths: number
  assists: number
  score: number
}

function isRiotMatchDto(value: unknown): value is RiotMatchDto {
  return Boolean(value && typeof value === "object" && "matchInfo" in value && "players" in value)
}

function resolvePlayerName(player: RiotMatchDto["players"][number]) {
  if (player.gameName && player.tagLine) {
    return `${player.gameName}#${player.tagLine}`
  }

  if (player.gameName) {
    return player.gameName
  }

  return `Player ${player.puuid.slice(0, 8)}`
}

export async function getMatchesData(puuid?: string, periodDays = 60, queue?: string) {
  const analytics = await getAnalyticsPayload(env.enableMockRiot ? undefined : puuid, {
    periodDays,
    queue,
  })
  const matches = analytics.filteredMatches
  return {
    matches,
    agents: buildAgentBreakdown(matches),
    maps: buildMapBreakdown(matches),
    analytics,
  }
}

export async function getMatchById(matchId: string, puuid?: string) {
  const matches = env.enableMockRiot
    ? await riotAdapter.getNormalizedMatches()
    : await riotAdapter.getNormalizedMatches(puuid)
  const match = matches.find((item) => item.matchId === matchId)
  const baseline = {
    acs: matches.reduce((sum, item) => sum + item.acsEstimate, 0) / Math.max(1, matches.length),
    kda:
      matches.reduce((sum, item) => sum + (item.kills + item.assists) / Math.max(1, item.deaths), 0) /
      Math.max(1, matches.length),
  }

  let playerRows: MatchPlayerRow[] = []

  if (!env.enableMockRiot && match && puuid) {
    const rawMatch = await riotAdapter.getMatchById(matchId).catch(() => null)
    if (isRiotMatchDto(rawMatch)) {
      playerRows = rawMatch.players.map((player) => ({
        name: resolvePlayerName(player),
        teamId: player.teamId,
        agentName: player.characterName || player.characterId || "Unknown Agent",
        agentImageUrl: null,
        agentIconUrl: null,
        kills: player.stats.kills ?? 0,
        deaths: player.stats.deaths ?? 0,
        assists: player.stats.assists ?? 0,
        score: player.stats.score ?? 0,
      }))
    }
  }

  return {
    match,
    baseline,
    playerRows,
  }
}
