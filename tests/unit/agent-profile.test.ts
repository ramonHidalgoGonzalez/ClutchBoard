import { buildAgentProfile } from "@/server/valorant/analytics/agent-profile"
import type { MatchPerformance } from "@/types/domain"

let n = 0
function mk(over: Partial<MatchPerformance> = {}): MatchPerformance {
  n += 1
  return {
    matchId: `m${n}`,
    startedAt: new Date(2026, 0, n).toISOString(),
    durationSeconds: 1800,
    queueId: "competitive",
    queueName: "Competitive",
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "sova",
    agentName: "Sova",
    outcome: "win",
    roundsWon: 13,
    roundsLost: 7,
    roundsPlayed: 20,
    kills: 20,
    deaths: 12,
    assists: 6,
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
    abilityCasts: { grenadeCasts: 6, ability1Casts: 10, ability2Casts: 3, ultimateCasts: 2 },
    sessionIndex: 1,
    source: "official-riot",
    officialFields: [],
    derivedFields: [],
    ...over,
  } as MatchPerformance
}

describe("buildAgentProfile", () => {
  const agentMatches = [
    mk({ outcome: "win", mapName: "Haven" }),
    mk({ outcome: "loss", mapName: "Lotus", kills: 10, deaths: 16 }),
    mk({ outcome: "win", mapName: "Haven" }),
  ]
  const all = [...agentMatches, mk({ agentName: "Jett", outcome: "loss", acsEstimate: 150 })]

  it("aggregates wins/losses, share and rounds", () => {
    const p = buildAgentProfile(agentMatches, all, all.length)
    expect(p.games).toBe(3)
    expect(p.wins).toBe(2)
    expect(p.losses).toBe(1)
    expect(p.roundsWon).toBeGreaterThan(0)
    expect(p.sharePct).toBeCloseTo((3 / 4) * 100, 1)
  })

  it("derives a grade and a comparison vs overall", () => {
    const p = buildAgentProfile(agentMatches, all, all.length)
    expect(["S", "A", "B", "C", "D"]).toContain(p.grade.letter)
    expect(p.comparison.find((r) => r.key === "acs")).toBeTruthy()
  })

  it("builds ability usage per round from casts", () => {
    const p = buildAgentProfile(agentMatches, all, all.length)
    expect(p.abilities.length).toBe(4)
    expect(p.abilities[0].perRound).toBeGreaterThan(0)
  })

  it("returns empty abilities when no casts are present", () => {
    const p = buildAgentProfile([mk({ abilityCasts: null })], all, all.length)
    expect(p.abilities.length).toBe(0)
  })
})
