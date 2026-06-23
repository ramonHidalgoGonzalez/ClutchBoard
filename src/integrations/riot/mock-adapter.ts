import { MOCK_AGENT_CATALOG, MOCK_MAP_CATALOG } from "@/integrations/riot/catalog"
import { createMockMatches, mockAccountProfile } from "@/integrations/riot/mock-data"
import type { RiotContentDto, RiotLeaderboardDto, RiotPlatformStatusDto } from "@/types/riot"

export async function getCurrentAccount(accessToken?: string) {
  void accessToken
  return mockAccountProfile
}

export async function getNormalizedMatches(puuid?: string) {
  // If a puuid is provided, bind the mock profile and match ids to it
  // so mock data appears linked to the logged-in account.
  if (puuid) {
    // mutate exported mock profile so other helpers like getMatchListByPuuid return the same puuid
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockAccountProfile as any).puuid = puuid
  }
  return createMockMatches(undefined, puuid)
}

export async function getMatchListByPuuid() {
  const matches = createMockMatches(undefined, mockAccountProfile.puuid)
  return {
    puuid: mockAccountProfile.puuid,
    history: matches.map((match) => match.matchId),
  }
}

export async function getMatchById(matchId: string) {
  return createMockMatches(undefined, mockAccountProfile.puuid).find((match) => match.matchId === matchId) ?? null
}

export async function getContent(): Promise<RiotContentDto> {
  return {
    version: "mock-1.0",
    characters: MOCK_AGENT_CATALOG,
    maps: MOCK_MAP_CATALOG,
    acts: [
      { id: "act-ep9a1", name: "Episodio 9 // Acto 1", type: "act", isActive: true },
      { id: "act-ep8a3", name: "Episodio 8 // Acto 3", type: "act", isActive: false },
      { id: "act-ep8a2", name: "Episodio 8 // Acto 2", type: "act", isActive: false },
    ],
  }
}

export async function getLeaderboardByAct(actId: string): Promise<RiotLeaderboardDto> {
  return {
    actId,
    totalPlayers: 3,
    players: [
      { puuid: "one", gameName: "RadiantOne", tagLine: "EUW", leaderboardRank: 1, rankedRating: 890, numberOfWins: 110 },
      { puuid: "two", gameName: "RadiantTwo", tagLine: "EUW", leaderboardRank: 2, rankedRating: 875, numberOfWins: 103 },
      { puuid: mockAccountProfile.puuid, gameName: mockAccountProfile.gameName, tagLine: mockAccountProfile.tagLine, leaderboardRank: 250, rankedRating: 410, numberOfWins: 38 },
    ],
  }
}

export async function getPlatformStatus(): Promise<RiotPlatformStatusDto> {
  return {
    id: "eu",
    name: "EU",
    locales: ["en_US", "es_ES"],
    maintenances: [],
    incidents: [],
  }
}

export async function exchangeCodeForTokens() {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    scope: "openid offline_access",
    token_type: "Bearer",
  }
}
