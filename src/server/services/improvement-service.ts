import { generateImprovementInsights } from "@/analytics/improvement-engine"
import { buildAgentBreakdown, buildMapBreakdown, buildSummaryStats } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"

export async function getImprovementData() {
  const matches = await riotAdapter.getNormalizedMatches()

  return {
    insights: generateImprovementInsights(matches),
    summary: buildSummaryStats(matches),
    agents: buildAgentBreakdown(matches),
    maps: buildMapBreakdown(matches),
    matches,
  }
}
