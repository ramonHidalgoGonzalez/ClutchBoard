import { getPrisma } from "@/database/prisma"
import type { MatchOutcome } from "@prisma/client"
import type { MatchPerformance } from "@/types/domain"
import {
  paginate,
  type MatchHistoryRepository,
  type MatchPageParams,
  type NormalizedMatch,
  type PaginatedMatches,
} from "@/server/valorant/matches/match-history-repository"

function toOutcome(outcome: MatchPerformance["outcome"]): MatchOutcome {
  if (outcome === "win") return "win"
  if (outcome === "loss") return "loss"
  return "draw"
}

/** Postgres-backed history via the existing Match / MatchParticipant models. */
export class PrismaMatchHistoryRepository implements MatchHistoryRepository {
  async listSyncedMatchIds(puuid: string): Promise<Set<string>> {
    const prisma = getPrisma()
    if (!prisma) return new Set()
    const rows = await prisma.matchParticipant.findMany({ where: { puuid }, select: { matchId: true } })
    return new Set(rows.map((r) => r.matchId))
  }

  async getAllSyncedMatches(puuid: string): Promise<NormalizedMatch[]> {
    const prisma = getPrisma()
    if (!prisma) return []
    const participants = await prisma.matchParticipant.findMany({
      where: { puuid },
      include: { match: { include: { teams: true } } },
      orderBy: { match: { startedAt: "desc" } },
    })

    return participants.map((p, index) => {
      const team = p.match.teams.find((t) => t.teamId === p.teamId)
      return {
        matchId: p.matchId,
        startedAt: p.match.startedAt.toISOString(),
        durationSeconds: p.match.durationSeconds,
        queueId: p.match.queueId,
        queueName: p.match.queueName,
        gameMode: p.match.gameMode,
        mapId: p.match.mapId,
        mapName: p.match.mapName,
        agentId: p.agentId ?? p.agentName.toLowerCase(),
        agentName: p.agentName,
        outcome: p.outcome,
        roundsWon: team?.roundsWon ?? 0,
        roundsLost: team?.roundsLost ?? 0,
        roundsPlayed: p.match.roundsPlayed,
        // The whole point of persistence: keep seasonId so acts resolve.
        seasonId: p.match.seasonId ?? null,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        damage: p.damage ?? 0,
        headshots: p.headshots ?? 0,
        bodyshots: p.bodyshots ?? 0,
        legshots: p.legshots ?? 0,
        firstBloods: p.firstBloods ?? 0,
        firstDeaths: p.firstDeaths ?? 0,
        clutches: Number((p.derivedMetrics as { clutches?: number } | null)?.clutches ?? 0),
        score: p.score ?? 0,
        acsEstimate: p.combatScoreEstimate ?? 0,
        headshotPct: p.headshotPct ?? 0,
        sessionIndex: Math.floor(index / 4) + 1,
        source: "official-riot",
        officialFields: ["persisted.matchParticipant", "persisted.match"],
        derivedFields: ["sessionIndex", "clutches", "acsEstimate"],
      } satisfies MatchPerformance
    })
  }

  async getMatchesPage(puuid: string, params: MatchPageParams): Promise<PaginatedMatches> {
    return paginate(await this.getAllSyncedMatches(puuid), params)
  }

  async saveMatches(_userId: string, puuid: string, matches: NormalizedMatch[]): Promise<number> {
    const prisma = getPrisma()
    if (!prisma) return 0

    const account = await prisma.riotAccount.findUnique({ where: { puuid } })
    if (!account) return 0

    const existing = await this.listSyncedMatchIds(puuid)
    let saved = 0

    for (const m of matches) {
      try {
        await prisma.match.upsert({
          where: { id: m.matchId },
          update: { seasonId: m.seasonId ?? null },
          create: {
            id: m.matchId,
            mapId: m.mapId,
            mapName: m.mapName,
            queueId: m.queueId,
            queueName: m.queueName,
            gameMode: m.gameMode,
            startedAt: new Date(m.startedAt),
            durationSeconds: m.durationSeconds,
            roundsPlayed: m.roundsPlayed ?? m.roundsWon + m.roundsLost,
            seasonId: m.seasonId ?? null,
            platform: account.platform,
            region: account.region,
          },
        })

        await prisma.matchTeam.upsert({
          where: { matchId_teamId: { matchId: m.matchId, teamId: "primary" } },
          update: { won: m.outcome === "win", roundsWon: m.roundsWon, roundsLost: m.roundsLost },
          create: {
            matchId: m.matchId,
            teamId: "primary",
            won: m.outcome === "win",
            roundsWon: m.roundsWon,
            roundsLost: m.roundsLost,
          },
        })

        await prisma.matchParticipant.upsert({
          where: { matchId_puuid: { matchId: m.matchId, puuid } },
          update: {},
          create: {
            matchId: m.matchId,
            riotAccountId: account.id,
            puuid,
            teamId: "primary",
            agentId: m.agentId,
            agentName: m.agentName,
            outcome: toOutcome(m.outcome),
            kills: m.kills,
            deaths: m.deaths,
            assists: m.assists,
            score: m.score,
            damage: m.damage,
            headshots: m.headshots,
            bodyshots: m.bodyshots,
            legshots: m.legshots,
            firstBloods: m.firstBloods,
            firstDeaths: m.firstDeaths,
            combatScoreEstimate: m.acsEstimate,
            headshotPct: m.headshotPct,
            derivedMetrics: { clutches: m.clutches },
            isPrimaryUser: true,
          },
        })

        if (!existing.has(m.matchId)) saved += 1
      } catch {
        // Skip a single bad row rather than failing the whole sync.
      }
    }

    return saved
  }
}
