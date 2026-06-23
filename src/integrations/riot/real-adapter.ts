import { env } from "@/lib/env"
import { getLogger } from "@/lib/logger"
import { buildMapLookupKeys, normalizeContentKey, resolveCanonicalMapName } from "@/lib/valorant-content"
import { RiotHttpClient } from "@/integrations/riot/client"
import { mapRiotMatchToPerformance } from "@/integrations/riot/mapper"
import { riotAccountSchema, riotMatchListSchema, riotMatchSchema } from "@/integrations/riot/schemas"
import type { AccountProfile, MatchPerformance } from "@/types/domain"
import type {
  RiotAccountDto,
  RiotContentDto,
  RiotLeaderboardDto,
  RiotMatchDto,
  RiotMatchListDto,
  RiotPlatformStatusDto,
} from "@/types/riot"

const client = new RiotHttpClient()
const logger = getLogger()
const CONTENT_CACHE_TTL_MS = 12 * 60 * 60 * 1000

type ContentLookups = {
  agentById: Map<string, { name: string; imageUrl: string | null; iconUrl: string | null }>
  mapById: Map<string, { name: string; imageUrl: string | null; iconUrl: string | null }>
}

let contentCache: { expiresAt: number; lookups: ContentLookups } | null = null

function buildContentLookups(content: RiotContentDto): ContentLookups {
  const agentById = new Map<string, { name: string; imageUrl: string | null; iconUrl: string | null }>()
  const mapById = new Map<string, { name: string; imageUrl: string | null; iconUrl: string | null }>()

  for (const character of content.characters) {
    if (!character.id || !character.name) {
      continue
    }

    agentById.set(normalizeContentKey(character.id), {
      name: character.displayName ?? character.name,
      imageUrl: character.fullPortraitV2 ?? character.fullPortrait ?? character.assetPath ?? null,
      iconUrl: character.displayIcon ?? character.assetPath ?? null,
    })
  }

  for (const map of content.maps) {
    if (!map.id || !map.name) {
      continue
    }

    const record = {
      name: map.displayName ?? resolveCanonicalMapName(map.mapUrl ?? map.name),
      imageUrl: map.splash ?? null,
      iconUrl: map.listViewIcon ?? null,
    }

    for (const key of buildMapLookupKeys(map.id, map.name, map.displayName, map.mapUrl, map.assetPath)) {
      mapById.set(key, record)
    }
  }

  return { agentById, mapById }
}

async function getCachedContentLookups(): Promise<ContentLookups> {
  const now = Date.now()
  if (contentCache && contentCache.expiresAt > now) {
    return contentCache.lookups
  }

  try {
    const content = await getContent("en-US")
    const lookups = buildContentLookups(content)
    contentCache = {
      expiresAt: now + CONTENT_CACHE_TTL_MS,
      lookups,
    }
    return lookups
  } catch (error) {
    logger.warn(
      {
        scope: "real-adapter",
        stage: "content-lookup",
        message: error instanceof Error ? error.message : "unknown",
      },
      "Unable to refresh Riot content lookup cache",
    )

    return contentCache?.lookups ?? { agentById: new Map(), mapById: new Map() }
  }
}

function getPlayerSafeShape(match: RiotMatchDto) {
  const first = match.players.at(0)
  if (!first) {
    return null
  }

  return {
    keys: Object.keys(first),
    characterId: first.characterId ?? null,
    characterName: first.characterName ?? null,
    gameName: first.gameName ?? null,
    tagLine: first.tagLine ?? null,
    puuidPrefix: first.puuid ? first.puuid.slice(0, 8) : null,
  }
}

function resolveRegion() {
  if (env.riotRegion === "americas" || env.riotRegion === "asia" || env.riotRegion === "europe") {
    return env.riotRegion
  }

  return "europe"
}

function resolvePlatform() {
  if (["ap", "br", "esports", "eu", "kr", "latam", "na"].includes(env.riotPlatform)) {
    return env.riotPlatform as "ap" | "br" | "esports" | "eu" | "kr" | "latam" | "na"
  }

  return "eu"
}

export async function getCurrentAccount(accessToken?: string): Promise<AccountProfile> {
  if (!accessToken) {
    throw new Error("RSO access token is required to resolve the current Riot account.")
  }

  const region = resolveRegion()
  const account = riotAccountSchema.parse(
    await client.regionRequest<RiotAccountDto>(region, "/riot/account/v1/accounts/me", {
      accessToken,
    }),
  )

  return {
    puuid: account.puuid,
    gameName: account.gameName ?? "Unknown",
    tagLine: account.tagLine ?? "0000",
    region,
    platform: resolvePlatform(),
    linkedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    source: "official-riot",
  }
}

export async function getMatchListByPuuid(puuid: string) {
  const platform = resolvePlatform()
  return riotMatchListSchema.parse(
    await client.platformRequest(platform, `/val/match/v1/matchlists/by-puuid/${puuid}`),
  )
}

function extractMatchId(entry: RiotMatchListDto["history"][number]) {
  return typeof entry === "string" ? entry : entry.matchId
}

export async function getMatchById(matchId: string) {
  const platform = resolvePlatform()
  return riotMatchSchema.parse(await client.platformRequest(platform, `/val/match/v1/matches/${matchId}`))
}

export async function getNormalizedMatches(puuid?: string, maxMatches = 50): Promise<MatchPerformance[]> {
  if (!puuid) {
    throw new Error("A PUUID is required to request Riot match history.")
  }

  const matchList = await getMatchListByPuuid(puuid)
  const ids = matchList.history.map(extractMatchId).slice(0, maxMatches)
  const matches = await Promise.all(ids.map((id) => getMatchById(id)))
  const contentLookups = await getCachedContentLookups()

  return matches
    .map((match) =>
      mapRiotMatchToPerformance(match, puuid, {
        resolveAgentName: (characterId) => contentLookups.agentById.get(normalizeContentKey(characterId))?.name,
        resolveMapName: (mapId) => contentLookups.mapById.get(normalizeContentKey(mapId))?.name,
        resolveAgentImageUrl: (characterId) => contentLookups.agentById.get(normalizeContentKey(characterId))?.imageUrl,
        resolveAgentIconUrl: (characterId) => contentLookups.agentById.get(normalizeContentKey(characterId))?.iconUrl,
        resolveMapImageUrl: (mapId) => contentLookups.mapById.get(normalizeContentKey(mapId))?.imageUrl,
        resolveMapIconUrl: (mapId) => contentLookups.mapById.get(normalizeContentKey(mapId))?.iconUrl,
      }),
    )
    .filter((match): match is MatchPerformance => Boolean(match))
    .map((match, index) => ({
      ...match,
      sessionIndex: Math.floor(index / 4) + 1,
    }))
}

export async function getSafeMatchDetailShape(matchId: string) {
  const match = await getMatchById(matchId)
  return getPlayerSafeShape(match)
}

export async function getContent(locale = "en-US") {
  const platform = resolvePlatform()
  return client.platformRequest<RiotContentDto>(platform, `/val/content/v1/contents?locale=${locale}`)
}

export async function getLeaderboardByAct(actId: string, size = 200, startIndex = 0) {
  const platform = resolvePlatform()
  return client.platformRequest<RiotLeaderboardDto>(
    platform,
    `/val/ranked/v1/leaderboards/by-act/${actId}?size=${size}&startIndex=${startIndex}`,
  )
}

export async function getPlatformStatus() {
  const platform = resolvePlatform()
  return client.platformRequest<RiotPlatformStatusDto>(platform, "/val/status/v1/platform-data")
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.riotRsoRedirectUri,
  })

  return client.authRequest<{
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
    id_token?: string
  }>("/token", {
    method: "POST",
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.riotRsoClientId}:${env.riotRsoClientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
}
