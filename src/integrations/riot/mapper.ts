import type { MatchPerformance } from "@/types/domain"
import type { RiotMatchDto } from "@/types/riot"

export function mapRiotMatchToPerformance(match: RiotMatchDto, puuid: string): MatchPerformance | null {
  const player = match.players.find((candidate) => candidate.puuid === puuid)
  const team = player ? match.teams.find((candidate) => candidate.teamId === player.teamId) : null

  if (!player || !team) {
    return null
  }

  const roundStats =
    match.roundResults?.flatMap((round) => round.playerStats?.filter((entry) => entry.puuid === puuid) ?? []) ?? []

  const headshots = roundStats.reduce(
    (sum, entry) => sum + (entry.damage?.reduce((acc, item) => acc + item.headshots, 0) ?? 0),
    0,
  )
  const bodyshots = roundStats.reduce(
    (sum, entry) => sum + (entry.damage?.reduce((acc, item) => acc + item.bodyshots, 0) ?? 0),
    0,
  )
  const legshots = roundStats.reduce(
    (sum, entry) => sum + (entry.damage?.reduce((acc, item) => acc + item.legshots, 0) ?? 0),
    0,
  )
  const damage = roundStats.reduce(
    (sum, entry) => sum + (entry.damage?.reduce((acc, item) => acc + item.damage, 0) ?? 0),
    0,
  )

  const firstBloods = roundStats.filter((entry) => (entry.kills?.length ?? 0) > 0).length
  const acsEstimate = Math.round(damage / Math.max(1, player.stats.roundsPlayed ?? team.roundsWon + team.roundsLost))

  return {
    matchId: match.matchInfo.matchId,
    startedAt: new Date(match.matchInfo.gameStartMillis).toISOString(),
    durationSeconds: Math.round(match.matchInfo.gameLengthMillis / 1000),
    queueId: match.matchInfo.queueId,
    queueName: match.matchInfo.queueId,
    gameMode: match.matchInfo.gameMode,
    mapId: match.matchInfo.mapId,
    mapName: match.matchInfo.mapId,
    agentId: player.characterId,
    agentName: player.characterName,
    outcome: team.won ? "win" : "loss",
    roundsWon: team.roundsWon,
    roundsLost: team.roundsLost,
    kills: player.stats.kills,
    deaths: player.stats.deaths,
    assists: player.stats.assists,
    damage,
    headshots,
    bodyshots,
    legshots,
    firstBloods,
    firstDeaths: 0,
    clutches: 0,
    score: player.stats.score ?? 0,
    acsEstimate,
    headshotPct: headshots ? (headshots / Math.max(1, headshots + bodyshots + legshots)) * 100 : 0,
    sessionIndex: 0,
    source: "official-riot",
    officialFields: [
      "matchId",
      "startedAt",
      "durationSeconds",
      "queueId",
      "gameMode",
      "mapId",
      "agentId",
      "kills",
      "deaths",
      "assists",
      "score",
      "roundResults.damage",
    ],
    derivedFields: [
      "queueName",
      "mapName",
      "agentName",
      "acsEstimate",
      "headshotPct",
      "clutches",
      "firstDeaths",
    ],
  }
}
