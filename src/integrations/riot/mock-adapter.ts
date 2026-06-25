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

// Mock has no platform-wide recent feed; deep sync finds nothing (not an error).
export async function getRecentMatchIdsByQueue(_queue: string): Promise<string[]> {
  return []
}

export async function normalizeMatchForPuuid(matchId: string, puuid: string) {
  return createMockMatches(undefined, puuid).find((match) => match.matchId === matchId) ?? null
}

export async function getContent(): Promise<RiotContentDto> {
  return {
    version: "mock-1.0",
    characters: MOCK_AGENT_CATALOG,
    maps: MOCK_MAP_CATALOG,
    // Episodes + acts (VAL-CONTENT-V1 shape). Includes acts with no synced
    // matches so the selector can prove it lists all acts, not just played ones.
    acts: [
      { id: "ep8", name: "EPISODE 8", type: "episode", isActive: false },
      { id: "ep8a1", name: "ACT 1", type: "act", isActive: false },
      { id: "ep8a2", name: "ACT 2", type: "act", isActive: false },
      { id: "ep8a3", name: "ACT 3", type: "act", isActive: false },
      { id: "ep9", name: "EPISODE 9", type: "episode", isActive: false },
      { id: "ep9a1", name: "ACT 1", type: "act", isActive: false },
      { id: "ep9a2", name: "ACT 2", type: "act", isActive: false },
      { id: "ep9a3", name: "ACT 3", type: "act", isActive: false },
      { id: "ep10", name: "EPISODE 10", type: "episode", isActive: false },
      { id: "ep10a1", name: "ACT 1", type: "act", isActive: true },
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
