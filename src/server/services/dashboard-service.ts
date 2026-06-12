import { buildComparisons, buildKpis } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"
import { env } from "@/lib/env"
import { getLogger } from "@/lib/logger"
import { getAnalyticsPayload } from "@/server/services/analytics-service"
import { getCoachInsights } from "@/server/services/coach-service"
import type { AnalyticsPayload, DashboardPayload } from "@/types/domain"

type DashboardIdentity = {
  puuid: string
  gameName: string
  tagLine: string
}

function createEmptyAnalyticsPayload(): AnalyticsPayload {
  return {
    summary: {
      totalMatches: 0,
      winRate: 0,
      averageKda: 0,
      averageKills: 0,
      averageDeaths: 0,
      averageAssists: 0,
      averageAcs: 0,
      averageHsPercent: 0,
    },
    filteredMatches: [],
    trend: [],
    mapStats: [],
    agentStats: [],
    recentVsPrevious: {
      available: false,
      recentMatches: 0,
      previousMatches: 0,
      winRateDelta: 0,
      kdaDelta: 0,
      acsDelta: 0,
    },
    smallSampleWarnings: [],
  }
}

export async function getDashboardPayload(identity?: DashboardIdentity): Promise<DashboardPayload> {
  const logger = getLogger()
  const puuid = identity?.puuid
  let analytics: AnalyticsPayload = createEmptyAnalyticsPayload()
  let matchesFetchFailed = false
  let matchesFetchMessage: string | undefined

  try {
    analytics = await getAnalyticsPayload(env.enableMockRiot ? undefined : puuid)
  } catch (error) {
    matchesFetchFailed = true
    matchesFetchMessage = "Riot devolvio un error al consultar VAL-MATCH-V1."
    logger.warn(
      {
        scope: "dashboard-service",
        stage: "getNormalizedMatches",
        message: error instanceof Error ? error.message : "unknown",
      },
      "Falling back to empty matches dataset",
    )
  }

  const matches = analytics.filteredMatches
  const insights = await getCoachInsights(env.enableMockRiot ? undefined : puuid).catch(() => [])

  const status = await riotAdapter.getPlatformStatus()
  const profile = env.enableMockRiot
    ? await riotAdapter.getCurrentAccount()
    : {
        puuid: identity?.puuid ?? "unknown-puuid",
        gameName: identity?.gameName ?? "Linked",
        tagLine: identity?.tagLine ?? "RSO",
        region: env.riotRegion,
        platform: env.riotPlatform,
        linkedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        source: "official-riot" as const,
      }

  return {
    profile,
    kpis: buildKpis(matches),
    recentMatches: matches.slice(0, 10),
    trends: analytics.trend,
    agentBreakdown: analytics.agentStats,
    mapBreakdown: analytics.mapStats,
    improvementInsights: insights,
    comparisons: buildComparisons(matches),
    platformStatus: {
      label: status.name,
      incidents: status.incidents.length,
      maintenances: status.maintenances.length,
      source: env.enableMockRiot ? "mock-demo" : "official-riot",
    },
    metadata: {
      mode: env.enableMockRiot ? "mock" : "riot",
      lastSyncedAt: profile.lastSyncedAt,
      matchesFetchFailed,
      matchesFetchMessage,
      officialDataNotes: [
        "Profile account, content, matchlist, match detail and platform status come from official Riot APIs when RSO and production credentials are configured.",
        "Rate-limited Riot access is handled server-side only.",
      ],
      derivedDataNotes: [
        "ACS estimate, comfort picks, stability, momentum, fatigue and improvement insights are calculated by the app from real or mock match records.",
      ],
    },
  }
}
