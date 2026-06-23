import { subDays } from "date-fns"

import type { AccountProfile, MatchPerformance } from "@/types/domain"

const agents = ["Jett", "Sova", "Omen", "Killjoy", "Raze", "Skye"]
const maps = ["Ascent", "Bind", "Haven", "Split", "Lotus", "Sunset", "Icebox"]
const queues = ["Competitive", "Unrated", "Swiftplay"]

export const mockAccountProfile: AccountProfile = {
  puuid: "mock-puuid-123456",
  gameName: "RruMu",
  tagLine: "EUW",
  region: "europe",
  platform: "eu",
  linkedAt: subDays(new Date(), 90).toISOString(),
  lastSyncedAt: new Date().toISOString(),
  source: "mock-demo",
}

export function createMockMatches(count = 60, puuid?: string): MatchPerformance[] {
  const puuidPrefix = puuid ? `${puuid.slice(0, 6)}-` : ""
  return Array.from({ length: count }, (_, index) => {
    const dayOffset = index
    const agentName = agents[index % agents.length]
    const mapName = maps[(index * 2) % maps.length]
    const queueName = index % 4 === 0 ? queues[1] : index % 5 === 0 ? queues[2] : queues[0]
    const isWin = index % 3 !== 0
    const sessionIndex = Math.floor(index / 4) + 1
    const deaths = 12 + (index % 7)
    const kills = isWin ? 19 + (index % 8) : 12 + (index % 6)
    const assists = 4 + (index % 9)
    const damage = 118 + (kills * 17 + assists * 5) - deaths * 3 + (index % 20)
    const headshots = 8 + (index % 10)
    const bodyshots = 18 + (index % 12)
    const legshots = 3 + (index % 4)
    const firstBloods = index % 3 === 0 ? 1 : 3 + (index % 2)
    const firstDeaths = index % 4 === 0 ? 3 : 1
    const acsEstimate = Math.round(damage / 1.15 + kills * 4 - deaths * 1.5)

    return {
      matchId: `${puuidPrefix}mock-match-${count - index}`,
      startedAt: subDays(new Date(), dayOffset).toISOString(),
      durationSeconds: 1_880 + (index % 6) * 45,
      queueId: queueName.toLowerCase(),
      queueName,
      gameMode: queueName === "Competitive" ? "Bomb" : queueName,
      mapId: mapName.toLowerCase(),
      mapName,
      agentId: agentName.toLowerCase(),
      agentName,
      outcome: (isWin ? "win" : "loss") as "win" | "loss",
      roundsWon: isWin ? 13 : 8 + (index % 4),
      roundsLost: isWin ? 7 + (index % 4) : 13,
      roundsPlayed: (isWin ? 13 : 8 + (index % 4)) + (isWin ? 7 + (index % 4) : 13),
      // Platinum 1 .. Diamond 3 (15..20), only on competitive matches.
      competitiveTier: queueName === "Competitive" ? 15 + ((index * 2) % 6) : 0,
      // index 0 = most recent → current act; older blocks = previous acts.
      seasonId: index < 20 ? "act-ep9a1" : index < 40 ? "act-ep8a3" : "act-ep8a2",
      abilityCasts: {
        grenadeCasts: 5 + (index % 4),
        ability1Casts: 8 + (index % 6),
        ability2Casts: 3 + (index % 3),
        ultimateCasts: 1 + (index % 2),
      },
      kills,
      deaths,
      assists,
      damage,
      headshots,
      bodyshots,
      legshots,
      firstBloods,
      firstDeaths,
      clutches: index % 8 === 0 ? 1 : 0,
      score: 220 + kills * 16 - deaths * 6,
      acsEstimate,
      headshotPct: (headshots / Math.max(1, headshots + bodyshots + legshots)) * 100,
      sessionIndex,
      source: "mock-demo" as const,
      officialFields: [
        "matchId",
        "startedAt",
        "durationSeconds",
        "queueName",
        "mapName",
        "agentName",
        "kills",
        "deaths",
        "assists",
      ],
      derivedFields: ["acsEstimate", "headshotPct", "clutches"],
    } satisfies MatchPerformance
  }).reverse()
}
