import type { MatchPerformance } from "@/types/domain"
import type { RiotMatchDto } from "@/types/riot"

type RiotMapperOptions = {
  resolveAgentName?: (characterId: string) => string | undefined
  resolveMapName?: (mapId: string) => string | undefined
  resolveQueueName?: (queueId: string) => string | undefined
}

function sanitizeFallbackLabel(value: string) {
  const candidate = value.split("/").pop() ?? value
  return candidate.trim() || "Unknown"
}

function resolveAgentLabel(
  characterName: string | null | undefined,
  characterId: string | null | undefined,
  options?: RiotMapperOptions,
) {
  if (typeof characterName === "string" && characterName.trim().length > 0) {
    return characterName
  }

  if (typeof characterId === "string" && characterId.trim().length > 0) {
    const resolved = options?.resolveAgentName?.(characterId)
    if (resolved && resolved.trim().length > 0) {
      return resolved
    }

    return sanitizeFallbackLabel(characterId)
  }

  return "Unknown Agent"
}

export function mapRiotMatchToPerformance(
  match: RiotMatchDto,
  puuid: string,
  options?: RiotMapperOptions,
): MatchPerformance | null {
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
  const queueId = match.matchInfo.queueId ?? "unknown-queue"
  const mapId = match.matchInfo.mapId ?? "unknown-map"
  const safeAgentId = player.characterId ?? "unknown-agent"
  const queueName = options?.resolveQueueName?.(queueId) ?? queueId
  const mapName = options?.resolveMapName?.(mapId) ?? mapId
  const agentName = resolveAgentLabel(player.characterName, player.characterId, options)

  return {
    matchId: match.matchInfo.matchId,
    startedAt: new Date(match.matchInfo.gameStartMillis).toISOString(),
    durationSeconds: Math.round(match.matchInfo.gameLengthMillis / 1000),
    queueId,
    queueName,
    gameMode: match.matchInfo.gameMode,
    mapId,
    mapName,
    agentId: safeAgentId,
    agentName,
    outcome: team.won ? "win" : "loss",
    roundsWon: team.roundsWon,
    roundsLost: team.roundsLost,
    kills: player.stats.kills ?? 0,
    deaths: player.stats.deaths ?? 0,
    assists: player.stats.assists ?? 0,
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
