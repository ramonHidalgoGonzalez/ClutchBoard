export type RiotRegion = "americas" | "asia" | "europe"
export type RiotPlatform =
  | "ap"
  | "br"
  | "esports"
  | "eu"
  | "kr"
  | "latam"
  | "na"

export type RiotAccountDto = {
  puuid: string
  gameName: string | null
  tagLine: string | null
}

export type RiotContentDto = {
  version: string
  characters: Array<{ id: string; name: string; assetPath?: string | null }>
  maps: Array<{ id: string; name: string; assetPath?: string | null }>
  acts: Array<{ id: string; name: string; type: string; isActive: boolean }>
}

export type RiotMatchListDto = {
  puuid: string
  history: Array<
    | string
    | {
        matchId: string
        gameStartTimeMillis?: number
        queueId?: string
      }
  >
}

export type RiotMatchDto = {
  matchInfo: {
    matchId: string
    mapId: string
    gameStartMillis: number
    gameLengthMillis: number
    queueId: string
    gameMode: string
    seasonId?: string | null
    region: string
    provisioningFlowId?: string | null
    isCompleted?: boolean | null
  }
  players: Array<{
    puuid: string
    teamId: string
    characterId: string
    characterName: string
    stats: {
      score?: number
      roundsPlayed?: number
      kills: number
      deaths: number
      assists: number
      playtimeMillis?: number
      abilityCasts?: Record<string, number> | null
    }
    economy?: {
      spent?: number
    } | null
    behaviorFactors?: {
      afkRounds?: number
      friendlyFireIncoming?: number
      damageParticipationOutgoing?: number
    } | null
    competitiveTier?: number | null
  }>
  teams: Array<{
    teamId: string
    won: boolean
    roundsWon: number
    roundsLost: number
  }>
  roundResults?: Array<{
    roundNum: number
    winningTeam: string
    playerStats?: Array<{
      puuid: string
      kills?: Array<{ timeSinceGameStartMillis: number }>
      damage?: Array<{ damage: number; legshots: number; bodyshots: number; headshots: number }>
    }>
  }>
}

export type RiotLeaderboardDto = {
  actId: string
  totalPlayers: number
  players: Array<{
    puuid: string
    gameName: string
    tagLine: string
    leaderboardRank: number
    rankedRating: number
    numberOfWins: number
  }>
}

export type RiotPlatformStatusDto = {
  id: string
  name: string
  locales: string[]
  maintenances: Array<{ id: number; titles: Array<{ locale: string; content: string }> }>
  incidents: Array<{ id: number; updates: Array<{ translations: Array<{ locale: string; content: string }> }> }>
}
