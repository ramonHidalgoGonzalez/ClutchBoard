import { env } from "@/lib/env"
import { RiotHttpClient } from "@/integrations/riot/client"
import { mapRiotMatchToPerformance } from "@/integrations/riot/mapper"
import { riotAccountSchema, riotMatchListSchema, riotMatchSchema } from "@/integrations/riot/schemas"
import type { AccountProfile, MatchPerformance } from "@/types/domain"
import type {
  RiotAccountDto,
  RiotContentDto,
  RiotLeaderboardDto,
  RiotMatchListDto,
  RiotPlatformStatusDto,
} from "@/types/riot"

const client = new RiotHttpClient()

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

export async function getNormalizedMatches(puuid?: string, maxMatches = 20): Promise<MatchPerformance[]> {
  if (!puuid) {
    throw new Error("A PUUID is required to request Riot match history.")
  }

  const matchList = await getMatchListByPuuid(puuid)
  const ids = matchList.history.map(extractMatchId).slice(0, maxMatches)
  const matches = await Promise.all(ids.map((id) => getMatchById(id)))

  return matches
    .map((match) => mapRiotMatchToPerformance(match, puuid))
    .filter((match): match is MatchPerformance => Boolean(match))
    .map((match, index) => ({
      ...match,
      sessionIndex: Math.floor(index / 4) + 1,
    }))
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
