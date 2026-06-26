import {
  buildCompleteAgentBreakdown,
  buildCompleteMapBreakdown,
  buildSummaryStats,
} from "@/analytics/metrics"
import { filterStandardMaps } from "@/integrations/riot/catalog"
import { recentFirst } from "@/analytics/entity-stats"
import { buildScopedAnalytics, getEnrichedMatches } from "@/server/services/analytics-service"
import { buildCoachInsights } from "@/server/services/coach-service"
import { getContentCatalog } from "@/server/services/content-service"
import { buildImprovementReport } from "@/server/valorant/analytics/improvement-insights"
import type { MatchPerformance } from "@/types/domain"
import {
  buildActScopeOptions,
  countMatchesByAct,
  debugValorantHistoryCoverage,
  getAllValorantActs,
} from "@/server/valorant/content/acts"
import {
  filterMatchesByScope,
  getAvailableActScopes,
  normalizeRiotId,
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

  // For single-act scopes, compare against the previous act; otherwise the
  // engine splits the scoped set into recent vs older halves.
  const previousMatches =
    scope.type === "current_act" || scope.type === "act" ? previousActMatches(enriched, matches) : undefined
  const improvement = buildImprovementReport({ matches, previousMatches })

  return {
    insights,
    improvement,
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
 * Matches from the act immediately before the scoped act, ordered by recency.
 * Returns undefined when there is no detectable previous act (so the trend
 * section falls back to a recent-vs-older split inside the scoped set).
 */
function previousActMatches(
  enriched: MatchPerformance[],
  scopedMatches: MatchPerformance[],
): MatchPerformance[] | undefined {
  if (!scopedMatches.length) return undefined
  const currentActId = normalizeRiotId(recentFirst(scopedMatches)[0]?.actId)
  if (!currentActId) return undefined

  const newestByAct = new Map<string, number>()
  for (const m of enriched) {
    const id = normalizeRiotId(m.actId)
    if (!id) continue
    const ts = new Date(m.startedAt).getTime()
    if (!newestByAct.has(id) || ts > (newestByAct.get(id) ?? 0)) newestByAct.set(id, ts)
  }
  const orderedActIds = [...newestByAct.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  const idx = orderedActIds.indexOf(currentActId)
  if (idx < 0 || idx + 1 >= orderedActIds.length) return undefined
  const previousActId = orderedActIds[idx + 1]
  return enriched.filter((m) => normalizeRiotId(m.actId) === previousActId)
}

/**
 * Scope selector acts: ALL acts from content (even with 0 synced matches) +
 * a "Sin acto detectado" bucket. Falls back to acts detected in matches when
 * the content API is unavailable.
 */
async function buildScopeActs(enriched: Awaited<ReturnType<typeof getEnrichedMatches>>): Promise<ScopeActOption[]> {
  const allActs = await getAllValorantActs().catch(() => [])
  const counts = countMatchesByAct(enriched)

  if (allActs.length) debugValorantHistoryCoverage({ normalizedMatches: enriched, acts: allActs })

  let acts: ScopeActOption[]
  if (allActs.length) {
    const detectedLabels = new Map<string, string>()
    for (const m of enriched) {
      const key = normalizeRiotId(m.actId)
      if (key && (m.actLabel || m.actName)) detectedLabels.set(key, (m.actLabel || m.actName)!)
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
