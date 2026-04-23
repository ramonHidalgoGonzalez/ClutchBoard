import { getPrisma } from "@/database/prisma"
import { createMockMatches } from "@/integrations/riot/mock-data"
import type { MatchPerformance } from "@/types/domain"

export async function listStoredMatches(_puuid: string): Promise<MatchPerformance[]> {
  const prisma = getPrisma()

  if (!prisma) {
    return createMockMatches()
  }

  const participants = await prisma.matchParticipant.findMany({
    where: {
      puuid: _puuid,
    },
    include: {
      match: {
        include: {
          teams: true,
        },
      },
    },
    orderBy: {
      match: {
        startedAt: "desc",
      },
    },
  })

  return participants.map((participant, index) => {
    const team = participant.match.teams.find((candidate) => candidate.teamId === participant.teamId)
    return {
      matchId: participant.matchId,
      startedAt: participant.match.startedAt.toISOString(),
      durationSeconds: participant.match.durationSeconds,
      queueId: participant.match.queueId,
      queueName: participant.match.queueName,
      gameMode: participant.match.gameMode,
      mapId: participant.match.mapId,
      mapName: participant.match.mapName,
      agentId: participant.agentId ?? participant.agentName.toLowerCase(),
      agentName: participant.agentName,
      outcome: participant.outcome,
      roundsWon: team?.roundsWon ?? 0,
      roundsLost: team?.roundsLost ?? 0,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      damage: participant.damage ?? 0,
      headshots: participant.headshots ?? 0,
      bodyshots: participant.bodyshots ?? 0,
      legshots: participant.legshots ?? 0,
      firstBloods: participant.firstBloods ?? 0,
      firstDeaths: participant.firstDeaths ?? 0,
      clutches: Number((participant.derivedMetrics as { clutches?: number } | null)?.clutches ?? 0),
      score: participant.score ?? 0,
      acsEstimate: participant.combatScoreEstimate ?? 0,
      headshotPct: participant.headshotPct ?? 0,
      sessionIndex: Math.floor(index / 4) + 1,
      source: "official-riot",
      officialFields: ["persisted.matchParticipant", "persisted.match"],
      derivedFields: ["sessionIndex", "clutches", "acsEstimate"],
    } satisfies MatchPerformance
  })
}
