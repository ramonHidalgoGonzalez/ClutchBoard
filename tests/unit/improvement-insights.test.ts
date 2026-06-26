import { describe, expect, it } from "vitest"

import type { MatchPerformance } from "@/types/domain"
import { buildImprovementReport } from "@/server/valorant/analytics/improvement-insights"

let seq = 0
function mk(o: Partial<MatchPerformance> = {}): MatchPerformance {
  seq += 1
  const mapName = o.mapName ?? "Ascent"
  const agentName = o.agentName ?? "Jett"
  return {
    matchId: o.matchId ?? `m${seq}`,
    startedAt: o.startedAt ?? new Date(Date.UTC(2026, 0, 1) + seq * 86_400_000).toISOString(),
    durationSeconds: 1800,
    queueId: "competitive",
    queueName: "Competitive",
    gameMode: "Bomb",
    mapId: mapName,
    mapName,
    agentId: agentName,
    agentName,
    outcome: "win",
    roundsWon: 13,
    roundsLost: 7,
    kills: 18,
    deaths: 14,
    assists: 5,
    damage: 3000,
    headshots: 20,
    bodyshots: 30,
    legshots: 3,
    firstBloods: 2,
    firstDeaths: 2,
    clutches: 0,
    score: 250,
    acsEstimate: 210,
    headshotPct: 25,
    sessionIndex: 1,
    competitiveTier: 18,
    source: "mock-demo",
    officialFields: [],
    derivedFields: [],
    ...o,
  }
}

function many(n: number, o: Partial<MatchPerformance> = {}) {
  return Array.from({ length: n }, () => mk(o))
}

describe("buildImprovementReport — empty / insufficient", () => {
  it("returns an empty, non-inventive report with no matches", () => {
    const r = buildImprovementReport({ matches: [] })
    expect(r.sampleSize).toBe(0)
    expect(r.sufficient).toBe(false)
    expect(r.priorities).toHaveLength(0)
    expect(r.insights).toHaveLength(0)
    expect(r.mapProblems).toHaveLength(0)
    expect(r.agentProblems).toHaveLength(0)
    expect(r.trend.available).toBe(false)
  })

  it("does not invent problem insights below the minimum sample", () => {
    const r = buildImprovementReport({ matches: many(5, { outcome: "loss", acsEstimate: 120 }) })
    expect(r.sufficient).toBe(false)
    // No fabricated problem insights…
    expect(r.priorities).toHaveLength(0)
    // …but still offers 3 generic training tasks.
    expect(r.trainingTasks).toHaveLength(3)
  })
})

describe("buildImprovementReport — worst map / agent", () => {
  function dataset() {
    return [
      // Strong, frequent map+agent (best).
      ...many(6, { mapName: "Haven", agentName: "Deadlock", outcome: "win", acsEstimate: 240, kills: 22, deaths: 12 }),
      // Weak map+agent (worst): losing, low impact, early deaths.
      ...many(5, { mapName: "Lotus", agentName: "Raze", outcome: "loss", acsEstimate: 130, kills: 10, deaths: 18, firstDeaths: 6 }),
      // Neutral filler.
      ...many(4, { mapName: "Ascent", agentName: "Sova", outcome: "win", acsEstimate: 200 }),
    ]
  }

  it("detects the worst map and surfaces it first", () => {
    const r = buildImprovementReport({ matches: dataset() })
    expect(r.sufficient).toBe(true)
    expect(r.mapProblems[0].slug).toBe("lotus")
    expect(r.mapProblems[0].severity).toBe("high")
    expect(r.insights.some((i) => i.type === "maps" && i.affectedMaps?.includes("Lotus"))).toBe(true)
  })

  it("detects the worst agent and its worst map", () => {
    const r = buildImprovementReport({ matches: dataset() })
    expect(r.agentProblems[0].slug).toBe("raze")
    expect(r.agentProblems[0].worstMap).toBe("Lotus")
    expect(r.insights.some((i) => i.type === "agents" && i.affectedAgents?.includes("Raze"))).toBe(true)
  })

  it("detects strengths (best agent / best map)", () => {
    const r = buildImprovementReport({ matches: dataset() })
    expect(r.strengths.bestAgent?.name).toBe("Deadlock")
    expect(r.strengths.bestMap?.name).toBe("Haven")
    expect(r.insights.some((i) => i.type === "best_strengths")).toBe(true)
  })
})

describe("buildImprovementReport — trend (current act vs previous)", () => {
  it("compares the current set against the provided previous set", () => {
    const previous = many(8, { acsEstimate: 150, kills: 12, deaths: 16, outcome: "loss" })
    const current = many(8, { acsEstimate: 230, kills: 20, deaths: 12, outcome: "win" })
    const r = buildImprovementReport({ matches: current, previousMatches: previous })
    expect(r.trend.available).toBe(true)
    expect(r.trend.kind).toBe("act")
    const acs = r.trend.metrics.find((m) => m.metricKey === "acs")
    expect(acs?.direction).toBe("up")
    const winrate = r.trend.metrics.find((m) => m.metricKey === "winrate")
    expect(winrate?.direction).toBe("up")
  })

  it("falls back to a recent-vs-older split when no previous set is given", () => {
    const older = many(6, { acsEstimate: 150 })
    const recent = many(6, { acsEstimate: 230 })
    const r = buildImprovementReport({ matches: [...older, ...recent] })
    expect(r.trend.available).toBe(true)
    expect(r.trend.kind).toBe("recent")
  })
})

describe("buildImprovementReport — ordering & scope", () => {
  it("orders priorities by severity/score (high before low)", () => {
    const r = buildImprovementReport({
      matches: [
        ...many(6, { mapName: "Haven", agentName: "Deadlock", outcome: "win", acsEstimate: 240 }),
        ...many(5, { mapName: "Lotus", agentName: "Raze", outcome: "loss", acsEstimate: 120, deaths: 19, firstDeaths: 7 }),
        ...many(4, { mapName: "Ascent", agentName: "Sova" }),
      ],
    })
    const weight = (s: string) => (s === "high" ? 3 : s === "medium" ? 2 : 1)
    for (let i = 1; i < r.priorities.length; i++) {
      expect(r.priorities[i - 1].score).toBeGreaterThanOrEqual(r.priorities[i].score)
      expect(weight(r.priorities[i - 1].severity)).toBeGreaterThanOrEqual(weight(r.priorities[i].severity))
    }
    expect(r.priorities.length).toBeLessThanOrEqual(3)
  })

  it("only uses the matches it is given (scope-respecting)", () => {
    const all = [
      ...many(10, { mapName: "Bind", agentName: "Cypher", acsEstimate: 300 }),
      ...many(10, { mapName: "Split", agentName: "Omen", acsEstimate: 100 }),
    ]
    const subset = all.filter((m) => m.mapName === "Bind")
    const r = buildImprovementReport({ matches: subset })
    expect(r.sampleSize).toBe(10)
    // Only Bind/Cypher exist in this scoped report.
    expect(r.mapProblems.every((m) => m.mapName === "Bind")).toBe(true)
    expect(r.agentProblems.every((a) => a.agentName === "Cypher")).toBe(true)
  })
})
