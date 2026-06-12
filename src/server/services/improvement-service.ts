import {
  buildCompleteAgentBreakdown,
  buildCompleteMapBreakdown,
  buildSummaryStats,
} from "@/analytics/metrics"
import { filterStandardMaps } from "@/integrations/riot/catalog"
import { getAnalyticsPayload } from "@/server/services/analytics-service"
import { getCoachInsights } from "@/server/services/coach-service"
import { getContentCatalog } from "@/server/services/content-service"

export async function getImprovementData(puuid?: string) {
  const analytics = await getAnalyticsPayload(puuid)
  const insights = await getCoachInsights(puuid)
  const content = await getContentCatalog().catch(() => null)
  const matches = analytics.filteredMatches

  return {
    insights,
    summary: buildSummaryStats(matches),
    agents: content
      ? buildCompleteAgentBreakdown(
          matches,
          content.agents.map((item) => ({ name: item.displayName })),
        )
      : analytics.agentStats,
    maps: content
      ? buildCompleteMapBreakdown(matches, filterStandardMaps(content.maps.map((item) => ({ name: item.displayName }))))
      : analytics.mapStats,
    matches,
    content,
    analytics,
  }
}
