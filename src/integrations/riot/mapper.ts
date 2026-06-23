import { resolveCanonicalMapName } from "@/lib/valorant-content"
import type { MatchPerformance } from "@/types/domain"
import type { RiotMatchDto } from "@/types/riot"

type RiotMapperOptions = {
  resolveAgentName?: (characterId: string) => string | undefined
  resolveMapName?: (mapId: string) => string | undefined
  resolveAgentImageUrl?: (characterId: string, resolvedName: string) => string | null | undefined
  resolveAgentIconUrl?: (characterId: string, resolvedName: string) => string | null | undefined
  resolveMapImageUrl?: (mapId: string, resolvedName: string) => string | null | undefined
  resolveMapIconUrl?: (mapId: string, resolvedName: string) => string | null | undefined
  resolveQueueName?: (queueId: string) => string | undefined
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function deriveRoundsLost(team: RiotMatchDto["teams"][number], opponent?: RiotMatchDto["teams"][number]) {
  const explicit = toFiniteNumber(team.roundsLost)
  if (explicit !== null) {
    return Math.max(0, explicit)
  }

  const roundsPlayed = toFiniteNumber(team.roundsPlayed)
  const roundsWon = toFiniteNumber(team.roundsWon)
  if (roundsPlayed !== null && roundsWon !== null) {
    return Math.max(0, roundsPlayed - roundsWon)
  }

  const opponentRoundsWon = toFiniteNumber(opponent?.roundsWon)
  if (opponentRoundsWon !== null) {
    return Math.max(0, opponentRoundsWon)
  }

  return 0
}

function deriveOutcome(team: RiotMatchDto["teams"][number], opponent?: RiotMatchDto["teams"][number]) {
  if (team.won === true) {
    return "win" as const
  }

  if (team.won === false) {
    return "loss" as const
  }

  const teamRoundsWon = toFiniteNumber(team.roundsWon)
  const opponentRoundsWon = toFiniteNumber(opponent?.roundsWon)

  if (teamRoundsWon !== null && opponentRoundsWon !== null) {
    if (teamRoundsWon > opponentRoundsWon) {
      return "win" as const
    }
    if (teamRoundsWon < opponentRoundsWon) {
      return "loss" as const
    }
    return "draw" as const
  }

  return "unknown" as const
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
  const opponent = team ? match.teams.find((candidate) => candidate.teamId !== team.teamId) : undefined

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
  const roundsWon = Math.max(0, toFiniteNumber(team.roundsWon) ?? 0)
  const roundsLost = deriveRoundsLost(team, opponent)
  const acsEstimate = Math.round(damage / Math.max(1, player.stats.roundsPlayed ?? roundsWon + roundsLost))
  const queueId = match.matchInfo.queueId ?? "unknown-queue"
  const mapId = match.matchInfo.mapId ?? "unknown-map"
  const safeAgentId = player.characterId ?? "unknown-agent"
  const queueName = options?.resolveQueueName?.(queueId) ?? queueId
  const mapName = options?.resolveMapName?.(mapId) ?? resolveCanonicalMapName(mapId)
  const agentName = resolveAgentLabel(player.characterName, player.characterId, options)
  const agentImageUrl =
    player.characterId && options?.resolveAgentImageUrl
      ? options.resolveAgentImageUrl(player.characterId, agentName) ?? null
      : null
  const agentIconUrl =
    player.characterId && options?.resolveAgentIconUrl
      ? options.resolveAgentIconUrl(player.characterId, agentName) ?? null
      : null
  const mapImageUrl = options?.resolveMapImageUrl ? options.resolveMapImageUrl(mapId, mapName) ?? null : null
  const mapIconUrl = options?.resolveMapIconUrl ? options.resolveMapIconUrl(mapId, mapName) ?? null : null

  return {
    matchId: match.matchInfo.matchId,
    startedAt: new Date(match.matchInfo.gameStartMillis).toISOString(),
    durationSeconds: Math.round(match.matchInfo.gameLengthMillis / 1000),
    queueId,
    queueName,
    gameMode: match.matchInfo.gameMode,
    mapId,
    mapName,
    mapImageUrl,
    mapIconUrl,
    agentId: safeAgentId,
    agentName,
    agentImageUrl,
    agentIconUrl,
    outcome: deriveOutcome(team, opponent),
    roundsWon,
    roundsLost,
    roundsPlayed: player.stats.roundsPlayed ?? roundsWon + roundsLost,
    abilityCasts: player.stats.abilityCasts ?? null,
    competitiveTier: player.competitiveTier ?? null,
    seasonId: match.matchInfo.seasonId ?? null,
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
