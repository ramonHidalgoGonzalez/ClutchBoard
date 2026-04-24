import { generateImprovementInsights } from "@/analytics/improvement-engine"
import {
  buildAgentBreakdown,
  buildCompleteAgentBreakdown,
  buildCompleteMapBreakdown,
  buildMapBreakdown,
  buildSummaryStats,
} from "@/analytics/metrics"
import { filterStandardMaps } from "@/integrations/riot/catalog"
import { riotAdapter } from "@/integrations/riot"

export async function getImprovementData() {
  const matches = await riotAdapter.getNormalizedMatches()
  const content = await riotAdapter.getContent().catch(() => null)

  return {
    insights: generateImprovementInsights(matches),
    summary: buildSummaryStats(matches),
    agents: content ? buildCompleteAgentBreakdown(matches, content.characters) : buildAgentBreakdown(matches),
    maps: content ? buildCompleteMapBreakdown(matches, filterStandardMaps(content.maps)) : buildMapBreakdown(matches),
    matches,
    content,
  }
}
