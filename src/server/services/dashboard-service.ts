import { generateImprovementInsights } from "@/analytics/improvement-engine"
import { buildAgentBreakdown, buildComparisons, buildKpis, buildMapBreakdown, buildTrendPoints } from "@/analytics/metrics"
import { riotAdapter } from "@/integrations/riot"
import { env } from "@/lib/env"
import { getLogger } from "@/lib/logger"
import type { DashboardPayload } from "@/types/domain"

type DashboardIdentity = {
  puuid: string
  gameName: string
  tagLine: string
}

export async function getDashboardPayload(identity?: DashboardIdentity): Promise<DashboardPayload> {
  const logger = getLogger()
  const puuid = identity?.puuid
  let matches = [] as Awaited<ReturnType<typeof riotAdapter.getNormalizedMatches>>
  let matchesFetchFailed = false
  let matchesFetchMessage: string | undefined

  try {
    matches = env.enableMockRiot
      ? await riotAdapter.getNormalizedMatches()
      : await riotAdapter.getNormalizedMatches(puuid)
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
    trends: buildTrendPoints(matches, 60),
    agentBreakdown: buildAgentBreakdown(matches),
    mapBreakdown: buildMapBreakdown(matches),
    improvementInsights: generateImprovementInsights(matches),
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
