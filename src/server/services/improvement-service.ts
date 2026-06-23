import {
  buildCompleteAgentBreakdown,
  buildCompleteMapBreakdown,
  buildSummaryStats,
} from "@/analytics/metrics"
import { filterStandardMaps } from "@/integrations/riot/catalog"
import { buildScopedAnalytics, getEnrichedMatches } from "@/server/services/analytics-service"
import { buildCoachInsights } from "@/server/services/coach-service"
import { getContentCatalog } from "@/server/services/content-service"
import {
  filterMatchesByScope,
  getAvailableActScopes,
  type AnalyticsScope,
} from "@/server/valorant/analytics/scope-filter"

export async function getImprovementData(puuid?: string, scope: AnalyticsScope = { type: "all" }) {
  const enriched = await getEnrichedMatches(puuid)
  const acts = getAvailableActScopes(enriched)
  const matches = filterMatchesByScope(enriched, scope)
  const analytics = buildScopedAnalytics(matches)
  const insights = buildCoachInsights(analytics)
  const content = await getContentCatalog().catch(() => null)

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
    allMatches: enriched,
    content,
    analytics,
    acts,
    scope,
    syncedTotal: enriched.length,
  }
}
