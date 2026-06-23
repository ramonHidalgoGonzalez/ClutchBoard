import {
  buildRankDistribution,
  buildRankProgression,
  buildRankedAgentStats,
  buildRankedMapStats,
  buildRankedOverview,
  buildRankedStreaks,
  competitiveMatches,
} from "@/server/valorant/analytics/ranked"
import type { MatchPerformance } from "@/types/domain"

let n = 0
function mk(over: Partial<MatchPerformance> = {}): MatchPerformance {
  n += 1
  const queueName = over.queueName ?? "Competitive"
  return {
    matchId: `m${n}`,
    startedAt: new Date(2026, 0, n).toISOString(),
    durationSeconds: 1800,
    queueId: queueName.toLowerCase(),
    queueName,
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "jett",
    agentName: "Jett",
    outcome: "win",
    roundsWon: 13,
    roundsLost: 8,
    roundsPlayed: 21,
    competitiveTier: 18,
    kills: 18,
    deaths: 12,
    assists: 5,
    damage: 3000,
    headshots: 10,
    bodyshots: 20,
    legshots: 2,
    firstBloods: 2,
    firstDeaths: 1,
    clutches: 0,
    score: 300,
    acsEstimate: 230,
    headshotPct: 28,
    sessionIndex: 1,
    source: "official-riot",
    officialFields: [],
    derivedFields: [],
    ...over,
  } as MatchPerformance
}

describe("competitive filtering", () => {
  it("ignores non-competitive queues", () => {
    const all = [mk(), mk({ queueName: "Deathmatch" }), mk({ queueName: "Unrated" }), mk({ queueName: "Swiftplay" })]
    expect(competitiveMatches(all).length).toBe(1)
  })
})

describe("buildRankedOverview", () => {
  it("uses last competitive tier as current and max as peak", () => {
    const o = buildRankedOverview([
      mk({ competitiveTier: 15 }),
      mk({ competitiveTier: 19 }),
      mk({ competitiveTier: 18 }),
    ])
    expect(o.currentTierId).toBe(18)
    expect(o.peakTierId).toBe(19)
    expect(o.rrAvailable).toBe(false)
    expect(o.rr).toBeNull()
  })

  it("counts only competitive matches", () => {
    const o = buildRankedOverview([mk(), mk({ outcome: "loss" }), mk({ queueName: "Deathmatch" })])
    expect(o.rankedMatches).toBe(2)
  })
})

describe("buildRankProgression", () => {
  it("orders points chronologically", () => {
    const points = buildRankProgression([
      mk({ startedAt: new Date(2026, 2, 2).toISOString(), competitiveTier: 19 }),
      mk({ startedAt: new Date(2026, 1, 1).toISOString(), competitiveTier: 16 }),
    ])
    expect(points[0].tierId).toBe(16)
    expect(points[1].tierId).toBe(19)
  })
})

describe("buildRankedStreaks", () => {
  it("computes current, best and worst streaks", () => {
    const s = buildRankedStreaks([
      mk({ outcome: "win" }),
      mk({ outcome: "win" }),
      mk({ outcome: "loss" }),
      mk({ outcome: "loss" }),
      mk({ outcome: "loss" }),
    ])
    expect(s.current).toEqual({ type: "loss", count: 3 })
    expect(s.bestWin).toBe(2)
    expect(s.worstLoss).toBe(3)
  })
})

describe("grouping", () => {
  it("groups ranked stats by agent and map", () => {
    const all = [mk({ agentName: "Breach", mapName: "Haven" }), mk({ agentName: "Sova", mapName: "Bind" })]
    expect(buildRankedAgentStats(all).length).toBe(2)
    expect(buildRankedMapStats(all).length).toBe(2)
  })

  it("groups distribution by tier", () => {
    const dist = buildRankDistribution([mk({ competitiveTier: 18 }), mk({ competitiveTier: 18 }), mk({ competitiveTier: 15 })])
    expect(dist.find((d) => d.tierId === 18)?.games).toBe(2)
    expect(dist.find((d) => d.tierId === 15)?.games).toBe(1)
  })

  it("does not invent RR when absent", () => {
    const o = buildRankedOverview([mk({ competitiveTier: 0 })])
    expect(o.rr).toBeNull()
    expect(o.currentTierId).toBeNull()
  })
})
