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
  buildActScopeOptions,
  countMatchesByAct,
  getAllValorantActs,
} from "@/server/valorant/content/acts"
import {
  filterMatchesByScope,
  getAvailableActScopes,
  NO_ACT_ID,
  type AnalyticsScope,
  type ScopeActOption,
} from "@/server/valorant/analytics/scope-filter"

export async function getImprovementData(puuid?: string, scope: AnalyticsScope = { type: "all" }) {
  const enriched = await getEnrichedMatches(puuid)
  const acts = await buildScopeActs(enriched)
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

/**
 * Scope selector acts: ALL acts from content (even with 0 synced matches) +
 * a "Sin acto detectado" bucket. Falls back to acts detected in matches when
 * the content API is unavailable.
 */
async function buildScopeActs(enriched: Awaited<ReturnType<typeof getEnrichedMatches>>): Promise<ScopeActOption[]> {
  const allActs = await getAllValorantActs().catch(() => [])
  const counts = countMatchesByAct(enriched)

  let acts: ScopeActOption[]
  if (allActs.length) {
    const detectedLabels = new Map<string, string>()
    for (const m of enriched) {
      if (m.actId && (m.actLabel || m.actName)) detectedLabels.set(m.actId, (m.actLabel || m.actName)!)
    }
    acts = buildActScopeOptions({
      acts: allActs,
      matchCountsByAct: counts,
      includeActsWithoutMatches: true,
      detectedLabels,
    })
  } else {
    // Content unavailable: list whatever acts the synced matches reveal.
    acts = getAvailableActScopes(enriched)
  }

  const noActCount = enriched.filter((m) => !m.actId).length
  if (noActCount > 0 && !acts.some((a) => a.actId === NO_ACT_ID)) {
    acts.push({ actId: NO_ACT_ID, label: "Sin acto detectado", isCurrent: false, games: noActCount })
  }
  return acts
}
