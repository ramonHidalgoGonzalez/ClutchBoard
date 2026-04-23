import { buildAgentBreakdown, buildMapBreakdown } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"

export async function getMatchesData() {
  const matches = await riotAdapter.getNormalizedMatches()
  return {
    matches,
    agents: buildAgentBreakdown(matches),
    maps: buildMapBreakdown(matches),
  }
}

export async function getMatchById(matchId: string) {
  const matches = await riotAdapter.getNormalizedMatches()
  const match = matches.find((item) => item.matchId === matchId)
  const baseline = {
    acs: matches.reduce((sum, item) => sum + item.acsEstimate, 0) / Math.max(1, matches.length),
    kda:
      matches.reduce((sum, item) => sum + (item.kills + item.assists) / Math.max(1, item.deaths), 0) /
      Math.max(1, matches.length),
  }

  return {
    match,
    baseline,
  }
}
