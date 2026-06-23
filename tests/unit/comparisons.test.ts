import {
  aggregate,
  buildAgentComparison,
  buildMapComparison,
  buildPeriodComparison,
  buildRecentTrendComparison,
  buildWinsLossesComparison,
  compareMetric,
  formatMetricValue,
} from "@/server/valorant/analytics/comparisons"
import type { MatchPerformance } from "@/types/domain"

let counter = 0
function mk(over: Partial<MatchPerformance> = {}): MatchPerformance {
  counter += 1
  return {
    matchId: `m${counter}`,
    startedAt: new Date(2026, 0, counter).toISOString(),
    durationSeconds: 1800,
    queueId: "competitive",
    queueName: "Competitive",
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "jett",
    agentName: "Jett",
    outcome: "win",
    roundsWon: 13,
    roundsLost: 8,
    kills: 20,
    deaths: 10,
    assists: 5,
    damage: 3000,
    headshots: 10,
    bodyshots: 20,
    legshots: 2,
    firstBloods: 2,
    firstDeaths: 1,
    clutches: 0,
    score: 300,
    acsEstimate: 240,
    headshotPct: 30,
    sessionIndex: 1,
    source: "official-riot",
    officialFields: [],
    derivedFields: [],
    ...over,
  } as MatchPerformance
}

describe("compareMetric", () => {
  it("computes a positive delta when higher is better", () => {
    const m = compareMetric("acs", "ACS", 240, 200, true, "number")
    expect(m.delta).toBe(40)
    expect(m.direction).toBe("up")
    expect(m.isPositive).toBe(true)
  })

  it("treats a lower deaths value as positive (higherIsBetter=false)", () => {
    const m = compareMetric("deaths", "Deaths", 10, 14, false, "ratio")
    expect(m.delta).toBe(-4)
    expect(m.direction).toBe("down")
    expect(m.isPositive).toBe(true)
  })

  it("returns null delta when previous is missing", () => {
    const m = compareMetric("hs", "HS%", 30, null, true, "percent")
    expect(m.delta).toBeNull()
    expect(m.isPositive).toBeNull()
  })
})

describe("aggregate", () => {
  it("returns null metrics for an empty set, without throwing", () => {
    const a = aggregate([])
    expect(a.games).toBe(0)
    expect(a.winRate).toBeNull()
    expect(a.kda).toBeNull()
  })

  it("leaves ACS/HS null when no match reports them", () => {
    const a = aggregate([mk({ acsEstimate: null as unknown as number, headshotPct: null as unknown as number })])
    expect(a.avgAcs).toBeNull()
    expect(a.hsPct).toBeNull()
  })
})

describe("buildPeriodComparison", () => {
  it("splits the last N and the previous N by count", () => {
    const matches = Array.from({ length: 20 }, () => mk())
    const cmp = buildPeriodComparison(matches, "last5", Date.UTC(2026, 5, 1))
    expect(cmp.available).toBe(true)
    expect(cmp.currentGames).toBe(5)
    expect(cmp.previousGames).toBe(5)
  })
})

describe("buildAgentComparison", () => {
  it("groups by agent and reports games per side", () => {
    const matches = [
      mk({ agentName: "Breach" }),
      mk({ agentName: "Breach", outcome: "loss", deaths: 16, kills: 10 }),
      mk({ agentName: "Sova" }),
    ]
    const cmp = buildAgentComparison(matches, "Breach", "Sova")
    expect(cmp.available).toBe(true)
    expect(cmp.a?.aggregate.games).toBe(2)
    expect(cmp.b?.aggregate.games).toBe(1)
  })

  it("is unavailable when the same agent is chosen twice", () => {
    const cmp = buildAgentComparison([mk({ agentName: "Jett" })], "Jett", "Jett")
    expect(cmp.available).toBe(false)
  })
})

describe("buildMapComparison", () => {
  it("groups by map", () => {
    const cmp = buildMapComparison([mk({ mapName: "Haven" }), mk({ mapName: "Lotus" })], "Haven", "Lotus")
    expect(cmp.available).toBe(true)
    expect(cmp.a?.name).toBe("Haven")
    expect(cmp.b?.name).toBe("Lotus")
  })
})

describe("buildWinsLossesComparison", () => {
  it("separates wins from losses", () => {
    const cmp = buildWinsLossesComparison([mk({ outcome: "win" }), mk({ outcome: "loss" }), mk({ outcome: "win" })])
    expect(cmp.available).toBe(true)
    expect(cmp.wins.games).toBe(2)
    expect(cmp.losses.games).toBe(1)
  })
})

describe("buildRecentTrendComparison", () => {
  it("splits recent vs previous windows into index-aligned lines", () => {
    const matches = Array.from({ length: 10 }, (_, i) => mk({ acsEstimate: 200 + i }))
    const cmp = buildRecentTrendComparison(matches, 5)
    expect(cmp.available).toBe(true)
    expect(cmp.lines.length).toBe(5)
    // recent window (last 5: ACS 205-209) is higher than the previous (200-204)
    expect(cmp.lines[0].recent).toBeGreaterThan(cmp.lines[0].previous as number)
  })
})

describe("formatMetricValue", () => {
  it("formats by type and shows dash for null", () => {
    expect(formatMetricValue(null, "number")).toBe("—")
    expect(formatMetricValue(54.2, "percent")).toBe("54.2%")
    expect(formatMetricValue(1.482, "ratio")).toBe("1.48")
    expect(formatMetricValue(1800, "duration")).toBe("30 min")
  })
})
