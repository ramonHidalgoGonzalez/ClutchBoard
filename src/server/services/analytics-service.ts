import { cache } from "react"

import {
  calculateAverageAcs,
  calculateAverageDamage,
  calculateKda,
  calculateWinRate,
} from "@/analytics/formulas"
import { buildTrendPoints } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"
import { env } from "@/lib/env"
import type {
  AgentBreakdown,
  AnalyticsPayload,
  AnalyticsSummary,
  MapBreakdown,
  MatchFilter,
  MatchPerformance,
  RecentComparison,
} from "@/types/domain"
import { getContentCatalog, resolveAgentContent, resolveMapContent } from "@/server/services/content-service"
import {
  classifyMatchAct,
  computeHistoryCoverage,
  formatActLabel,
  getActsById,
  getAllValorantActs,
  getValorantActs,
  type HistoryCoverage,
  type ValorantAct,
} from "@/server/valorant/content/acts"
import { filterMatchesByScope, type AnalyticsScope } from "@/server/valorant/analytics/scope-filter"
import { recentFirst } from "@/analytics/entity-stats"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getMapAssets } from "@/server/valorant/assets/map-assets"

function applyMatchFilters(matches: MatchPerformance[], filter?: MatchFilter) {
  const periodDays = filter?.periodDays ?? 90
  const threshold = Date.now() - periodDays * 24 * 60 * 60 * 1000

  return matches.filter((match) => {
    const timestamp = new Date(match.startedAt).getTime()
    const inPeriod = Number.isFinite(timestamp) ? timestamp >= threshold : true
    const inQueue = filter?.queue ? match.queueName.toLowerCase() === filter.queue.toLowerCase() : true
    return inPeriod && inQueue
  })
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildSummary(matches: MatchPerformance[]): AnalyticsSummary {
  return {
    totalMatches: matches.length,
    winRate: calculateWinRate(matches),
    averageKda: calculateKda(matches),
    averageKills: average(matches.map((match) => match.kills)),
    averageDeaths: average(matches.map((match) => match.deaths)),
    averageAssists: average(matches.map((match) => match.assists)),
    averageAcs: calculateAverageAcs(matches),
    averageHsPercent: average(matches.map((match) => match.headshotPct)),
  }
}

function getSampleConfidence(sampleSize: number) {
  if (sampleSize >= 20) {
    return 1
  }
  if (sampleSize >= 10) {
    return 0.75
  }
  if (sampleSize >= 5) {
    return 0.5
  }
  return 0.25
}

function getSampleLabel(sampleSize: number) {
  if (sampleSize >= 8) {
    return "good" as const
  }
  if (sampleSize >= 4) {
    return "medium" as const
  }
  return "small" as const
}

function buildAgentStats(matches: MatchPerformance[]): AgentBreakdown[] {
  const buckets = new Map<string, MatchPerformance[]>()

  for (const match of matches) {
    const key = match.agentId || match.agentName || "unknown-agent"
    const list = buckets.get(key) ?? []
    list.push(match)
    buckets.set(key, list)
  }

  return Array.from(buckets.entries())
    .map(([agentId, bucket]) => {
      const sampleSize = bucket.length
      const confidence = getSampleConfidence(sampleSize)
      const kda = calculateKda(bucket)
      const avgAcs = calculateAverageAcs(bucket)
      const avgDamage = calculateAverageDamage(bucket)
      const consistencyScore = Math.max(0, Math.min(100, 100 - Math.abs(avgAcs - calculateAverageAcs(matches)) / 2))
      const comfortPick = sampleSize >= Math.max(6, matches.length * 0.18)
      const needsWork = sampleSize >= 4 && calculateWinRate(bucket) + 5 < calculateWinRate(matches)

      return {
        agentId,
        agentName: bucket[0]?.agentName || "Unknown Agent",
        agentImageUrl: bucket[0]?.agentImageUrl ?? null,
        agentIconUrl: bucket[0]?.agentIconUrl ?? null,
        matches: sampleSize,
        winRate: calculateWinRate(bucket),
        kda,
        avgAcs,
        avgDamage,
        consistencyScore,
        impactScore: Math.max(0, Math.min(100, calculateWinRate(bucket) * 0.5 + kda * 15 + avgAcs * 0.12)),
        comfortPick,
        needsWork,
        sampleSize,
        confidence,
        source: env.enableMockRiot ? "mock-demo" : "official-riot",
      } satisfies AgentBreakdown
    })
    .sort((a, b) => b.matches - a.matches)
}

function buildMapStats(matches: MatchPerformance[]): MapBreakdown[] {
  const buckets = new Map<string, MatchPerformance[]>()

  for (const match of matches) {
    const key = match.mapId || match.mapName || "unknown-map"
    const list = buckets.get(key) ?? []
    list.push(match)
    buckets.set(key, list)
  }

  return Array.from(buckets.entries())
    .map(([mapId, bucket]) => {
      const sampleSize = bucket.length
      return {
        mapId,
        mapName: bucket[0]?.mapName || "Unknown Map",
        mapImageUrl: bucket[0]?.mapImageUrl ?? null,
        mapIconUrl: bucket[0]?.mapIconUrl ?? null,
        matches: sampleSize,
        winRate: calculateWinRate(bucket),
        kda: calculateKda(bucket),
        avgAcs: calculateAverageAcs(bucket),
        avgDamage: calculateAverageDamage(bucket),
        consistencyScore: Math.max(0, Math.min(100, 100 - Math.abs(calculateAverageAcs(bucket) - calculateAverageAcs(matches)) / 2)),
        sampleLabel: getSampleLabel(sampleSize),
        sampleSize,
        confidence: getSampleConfidence(sampleSize),
        source: env.enableMockRiot ? "mock-demo" : "official-riot",
      } satisfies MapBreakdown
    })
    .sort((a, b) => b.matches - a.matches)
}

function buildRecentVsPrevious(matches: MatchPerformance[]): RecentComparison {
  const recent = matches.slice(0, 10)
  const previous = matches.slice(10, 20)

  if (recent.length < 5 || previous.length < 5) {
    return {
      available: false,
      recentMatches: recent.length,
      previousMatches: previous.length,
      winRateDelta: 0,
      kdaDelta: 0,
      acsDelta: 0,
    }
  }

  return {
    available: true,
    recentMatches: recent.length,
    previousMatches: previous.length,
    winRateDelta: calculateWinRate(recent) - calculateWinRate(previous),
    kdaDelta: calculateKda(recent) - calculateKda(previous),
    acsDelta: calculateAverageAcs(recent) - calculateAverageAcs(previous),
  }
}

function buildSampleWarnings(matches: MatchPerformance[], mapStats: MapBreakdown[], agentStats: AgentBreakdown[]) {
  const warnings: string[] = []

  if (matches.length < 5) {
    warnings.push("Datos insuficientes: menos de 5 partidas.")
  }

  if (mapStats.some((map) => (map.sampleSize ?? 0) < 4)) {
    warnings.push("Algunos mapas tienen muestra pequena; interpreta el winrate con cautela.")
  }

  if (agentStats.some((agent) => (agent.sampleSize ?? 0) < 4)) {
    warnings.push("Algunos agentes tienen muestra pequena; evita conclusiones fuertes.")
  }

  return warnings
}

function enrichMatchesWithContent(
  matches: MatchPerformance[],
  catalog: Awaited<ReturnType<typeof getContentCatalog>>,
  actsById?: Map<string, ValorantAct>,
  actsList?: ValorantAct[],
) {
  const byId = actsById ?? new Map<string, ValorantAct>()
  return matches.map((match) => {
    const agentContent = resolveAgentContent(catalog, match.agentId, match.agentName)
    const mapContent = resolveMapContent(catalog, match.mapId, match.mapName)
    const actMeta = classifyMatchAct(match.seasonId, match.startedAt, byId, actsList)
    const seasonId = match.seasonId?.trim() || null
    const agentName = agentContent?.displayName || match.agentName || "Unknown Agent"
    const mapName = mapContent?.displayName || match.mapName || "Unknown Map"
    // characterId -> displayName -> slug -> curated local asset (per context).
    const agent = getAgentAssets(agentName)
    const map = getMapAssets(mapName)
    const agentRemote = agentContent?.fullPortraitUrl || match.agentImageUrl || null
    const agentIcon = agentContent?.displayIconUrl || match.agentIconUrl || null
    const mapSplash = mapContent?.splashUrl || match.mapImageUrl || null
    const mapIcon = mapContent?.listViewIconUrl || match.mapIconUrl || null

    return {
      ...match,
      agentName,
      agentImageUrl: agentRemote,
      agentIconUrl: agentIcon,
      // Local curated first, then remote content, then null (visual fallback).
      agentTableImageUrl: agent.table ?? agentIcon ?? agentRemote,
      agentCardImageUrl: agent.card ?? agentRemote,
      agentHeroImageUrl: agent.hero ?? agentRemote,
      mapName,
      mapImageUrl: mapSplash,
      mapIconUrl: mapIcon,
      mapThumbImageUrl: map.thumb ?? mapSplash,
      mapBannerImageUrl: map.banner ?? mapSplash,
      mapCardImageUrl: map.card ?? mapSplash,
      actId: actMeta?.id ?? seasonId,
      actName: actMeta?.actName ?? null,
      actLabel: actMeta ? formatActLabel(actMeta, "es") : null,
      episodeName: actMeta?.episodeName ?? null,
      isCurrentAct: actMeta?.isActive ?? false,
    }
  })
}

/**
 * All synced matches, enriched with content + act metadata (no scope filter).
 * Wrapped in React cache() so multiple callers in the same request (page +
 * insights + acts) share one fetch+enrich instead of recomputing per caller.
 */
export const getEnrichedMatches = cache(async (puuid?: string): Promise<MatchPerformance[]> => {
  const rawMatches = env.enableMockRiot
    ? await riotAdapter.getNormalizedMatches()
    : await riotAdapter.getNormalizedMatches(puuid)
  const catalog = await getContentCatalog()
  const [actsById, actsList] = await Promise.all([getActsById(), getValorantActs()])
  return enrichMatchesWithContent(rawMatches, catalog, actsById, actsList)
})

/** Build the analytics payload from an already-enriched (and scoped) match set. */
export function buildScopedAnalytics(filteredMatches: MatchPerformance[], periodDays = 60): AnalyticsPayload {
  const summary = buildSummary(filteredMatches)
  const mapStats = buildMapStats(filteredMatches)
  const agentStats = buildAgentStats(filteredMatches)
  return {
    summary,
    filteredMatches,
    trend: buildTrendPoints(filteredMatches, periodDays),
    mapStats,
    agentStats,
    recentVsPrevious: buildRecentVsPrevious(filteredMatches),
    smallSampleWarnings: buildSampleWarnings(filteredMatches, mapStats, agentStats),
  }
}

export async function getAnalyticsPayload(puuid?: string, filter?: MatchFilter): Promise<AnalyticsPayload> {
  const enriched = await getEnrichedMatches(puuid)
  const filteredMatches = applyMatchFilters(enriched, filter)
  return buildScopedAnalytics(filteredMatches, filter?.periodDays ?? 60)
}

/**
 * All synced matches for analytics/act counters — never the paginated visible
 * page. Alias of getEnrichedMatches to make the intent explicit at call sites.
 */
export const getAllSyncedMatchesForAnalytics = getEnrichedMatches

/** Paginated, scoped slice for the /matches UI (does not drive analytics). */
export async function getVisibleMatchesPage(
  puuid: string | undefined,
  { page = 1, pageSize = 20, scope }: { page?: number; pageSize?: number; scope?: AnalyticsScope },
): Promise<{ matches: MatchPerformance[]; total: number; page: number; pageSize: number }> {
  const enriched = await getEnrichedMatches(puuid)
  const scoped = scope ? filterMatchesByScope(enriched, scope) : enriched
  const ordered = recentFirst(scoped)
  const start = Math.max(0, (page - 1) * pageSize)
  return { matches: ordered.slice(start, start + pageSize), total: ordered.length, page, pageSize }
}

/** Dev/diagnostics: structured synced-history coverage report (no secrets). */
export async function getHistoryCoverage(puuid?: string): Promise<HistoryCoverage> {
  const [enriched, acts] = await Promise.all([getEnrichedMatches(puuid), getAllValorantActs()])
  return computeHistoryCoverage({ normalizedMatches: enriched, acts })
}
