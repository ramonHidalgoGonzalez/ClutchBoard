import { createMockMatches, mockAccountProfile } from "@/integrations/riot/mock-data"
import type { RiotContentDto, RiotLeaderboardDto, RiotPlatformStatusDto } from "@/types/riot"

export async function getCurrentAccount(accessToken?: string) {
  void accessToken
  return mockAccountProfile
}

export async function getNormalizedMatches(puuid?: string) {
  void puuid
  return createMockMatches()
}

export async function getMatchListByPuuid() {
  const matches = createMockMatches()
  return {
    puuid: mockAccountProfile.puuid,
    history: matches.map((match) => match.matchId),
  }
}

export async function getMatchById(matchId: string) {
  return createMockMatches().find((match) => match.matchId === matchId) ?? null
}

export async function getContent(): Promise<RiotContentDto> {
  return {
    version: "mock-1.0",
    characters: [
      { id: "jett", name: "Jett" },
      { id: "sova", name: "Sova" },
      { id: "omen", name: "Omen" },
      { id: "killjoy", name: "Killjoy" },
    ],
    maps: [
      { id: "ascent", name: "Ascent" },
      { id: "bind", name: "Bind" },
      { id: "haven", name: "Haven" },
      { id: "sunset", name: "Sunset" },
    ],
    acts: [{ id: "act-1", name: "Act 1", type: "act", isActive: true }],
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
