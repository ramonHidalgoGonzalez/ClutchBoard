import { describe, expect, it } from "vitest"

import {
  buildActScopeOptions,
  buildActsFromContent,
  classifyMatchAct,
  countMatchesByAct,
  formatActLabel,
  getActsById,
  type ValorantAct,
} from "@/server/valorant/content/acts"
import { buildActComparison } from "@/server/valorant/analytics/comparisons"
import type { MatchPerformance } from "@/types/domain"

const RAW = [
  { id: "ep9", name: "EPISODE 9", type: "episode", isActive: false },
  { id: "a1", name: "ACT 1", type: "act", isActive: false },
  { id: "ep8", name: "EPISODE 8", type: "episode", isActive: false },
  {
    id: "a2",
    name: "ACT 2",
    type: "act",
    isActive: true,
    localizedNames: { "es-ES": "ACTO DOS", "en-US": "ACT TWO" },
  },
]

describe("buildActsFromContent / getValorantActs", () => {
  it("pairs episodes with acts and numbers them", () => {
    const acts = buildActsFromContent(RAW, "es")
    expect(acts).toHaveLength(2)
    expect(acts[0]).toMatchObject({ id: "a1", episodeNumber: 9, actNumber: 1, episodeName: "EPISODE 9" })
    expect(acts[1]).toMatchObject({ id: "a2", episodeNumber: 8, actNumber: 2, isActive: true })
  })

  it("falls back to standalone acts when entries carry no type", () => {
    const acts = buildActsFromContent(
      [
        { id: "x", name: "Closed Beta", isActive: false },
        { id: "y", name: "Open Beta", isActive: true },
      ],
      "es",
    )
    expect(acts.map((a) => a.id)).toEqual(["x", "y"])
    expect(acts[1].isActive).toBe(true)
  })
})

describe("formatActLabel", () => {
  const acts = buildActsFromContent(RAW, "es")
  it("builds Episodio X // Acto Y in Spanish", () => {
    expect(formatActLabel(acts[0], "es")).toBe("Episodio 9 // Acto 1")
  })
  it("builds Episode X // Act Y in English", () => {
    expect(formatActLabel(acts[0], "en")).toBe("Episode 9 // Act 1")
  })
  it("prefers localizedName when present", () => {
    expect(formatActLabel(acts[1], "es")).toBe("ACTO DOS")
  })
})

describe("classifyMatchAct", () => {
  const byId = new Map<string, ValorantAct>(buildActsFromContent(RAW, "es").map((a) => [a.id, a]))
  const dated: ValorantAct[] = [
    { id: "d1", name: "Dated", startTime: "2026-01-01T00:00:00Z", endTime: "2026-02-01T00:00:00Z" },
  ]

  it("uses seasonId as actId when it matches metadata", () => {
    expect(classifyMatchAct("a2", "2026-06-01T00:00:00Z", byId)?.id).toBe("a2")
  })
  it("classifies by date when seasonId is missing", () => {
    expect(classifyMatchAct(null, "2026-01-15T00:00:00Z", new Map(), dated)?.id).toBe("d1")
  })
  it("returns null when nothing matches (Sin acto detectado)", () => {
    expect(classifyMatchAct(null, "2030-01-01T00:00:00Z", new Map(), dated)).toBeNull()
  })
})

function mk(actId: string, win: boolean): MatchPerformance {
  return {
    matchId: `m-${actId}-${win}-${Math.round(Math.abs(Math.sin(actId.length + (win ? 1 : 0))) * 1e6)}`,
    startedAt: new Date(2026, 0, 1).toISOString(),
    durationSeconds: 1800,
    queueId: "competitive",
    queueName: "Competitive",
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "jett",
    agentName: "Jett",
    outcome: win ? "win" : "loss",
    roundsWon: win ? 13 : 8,
    roundsLost: win ? 8 : 13,
    actId,
    kills: 20,
    deaths: 12,
    assists: 5,
    damage: 3000,
    headshots: 10,
    bodyshots: 20,
    legshots: 2,
    firstBloods: 2,
    firstDeaths: 1,
    clutches: 0,
    score: 250,
    acsEstimate: 220,
    headshotPct: 30,
    sessionIndex: 1,
    source: "mock-demo",
    officialFields: [],
    derivedFields: [],
  }
}

describe("buildActComparison", () => {
  const matches = [mk("a1", true), mk("a1", false), mk("a2", true), mk("a2", true)]

  it("compares competitive matches of two acts", () => {
    const cmp = buildActComparison(matches, "a1", "a2")
    expect(cmp.available).toBe(true)
    expect(cmp.aGames).toBe(2)
    expect(cmp.bGames).toBe(2)
    expect(cmp.metrics.find((m) => m.key === "winRate")).toBeTruthy()
  })

  it("is unavailable when one act has no ranked matches", () => {
    expect(buildActComparison(matches, "a1", "zzz").available).toBe(false)
  })
})

describe("buildActScopeOptions", () => {
  const acts = buildActsFromContent(RAW, "es") // a1 (ep9), a2 (ep8, active)

  it("lists ALL acts including ones with zero synced matches", () => {
    const counts = new Map<string, number>([["a1", 3]])
    const opts = buildActScopeOptions({ acts, matchCountsByAct: counts, includeActsWithoutMatches: true })
    expect(opts.map((o) => o.actId).sort()).toEqual(["a1", "a2"])
    expect(opts.find((o) => o.actId === "a1")?.games).toBe(3)
    expect(opts.find((o) => o.actId === "a2")?.games).toBe(0)
  })

  it("marks the active act as current without dropping the others", () => {
    const opts = buildActScopeOptions({ acts, matchCountsByAct: new Map() })
    expect(opts).toHaveLength(2)
    expect(opts.find((o) => o.actId === "a2")?.isCurrent).toBe(true)
    expect(opts.find((o) => o.actId === "a1")?.isCurrent).toBe(false)
  })

  it("can drop zero-match acts when includeActsWithoutMatches is false", () => {
    const counts = new Map<string, number>([["a1", 2]])
    const opts = buildActScopeOptions({ acts, matchCountsByAct: counts, includeActsWithoutMatches: false })
    expect(opts.map((o) => o.actId)).toEqual(["a1"])
  })

  it("keeps detected acts that content metadata is missing", () => {
    const counts = new Map<string, number>([["orphan", 4]])
    const opts = buildActScopeOptions({
      acts,
      matchCountsByAct: counts,
      detectedLabels: new Map([["orphan", "Acto X"]]),
    })
    expect(opts.find((o) => o.actId === "orphan")).toMatchObject({ games: 4, label: "Acto X" })
  })
})

describe("countMatchesByAct", () => {
  it("tallies matches per act and ignores undetected acts", () => {
    const counts = countMatchesByAct([
      mk("a1", true),
      mk("a1", false),
      mk("a2", true),
      { ...mk("a1", true), actId: null },
    ])
    expect(counts.get("a1")).toBe(2)
    expect(counts.get("a2")).toBe(1)
  })
})

describe("getActsById", () => {
  it("returns a map keyed by lowercased act id (empty if content unavailable)", async () => {
    const map = await getActsById("es")
    expect(map.size).toBeGreaterThanOrEqual(0)
    for (const key of map.keys()) {
      expect(key).toBe(key.toLowerCase())
    }
  })
})
