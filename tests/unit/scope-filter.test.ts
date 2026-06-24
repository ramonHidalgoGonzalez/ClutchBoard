import { describe, expect, it } from "vitest"

import type { MatchPerformance } from "@/types/domain"
import {
  filterMatchesByScope,
  getAvailableActScopes,
  getScopeLabel,
  groupMatchesByAct,
  normalizeRiotId,
  resolveScopeFromSearchParams,
} from "@/server/valorant/analytics/scope-filter"

function mk(i: number, actId: string, isCurrentAct: boolean, actName: string): MatchPerformance {
  // Higher i => more recent.
  return {
    matchId: `m-${i}`,
    startedAt: new Date(2026, 0, 1 + i).toISOString(),
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
    roundsLost: 7,
    actId,
    actName,
    isCurrentAct,
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

// 3 acts: a3 (current, newest 0..29), a2 (30..59), a1 (60..79)
const matches: MatchPerformance[] = [
  ...Array.from({ length: 30 }, (_, k) => mk(200 - k, "a3", true, "Acto 3")),
  ...Array.from({ length: 30 }, (_, k) => mk(100 - k, "a2", false, "Acto 2")),
  ...Array.from({ length: 20 }, (_, k) => mk(50 - k, "a1", false, "Acto 1")),
]

describe("filterMatchesByScope", () => {
  it("all returns every match", () => {
    expect(filterMatchesByScope(matches, { type: "all" }).length).toBe(80)
  })

  it("current_act returns only the active act", () => {
    const r = filterMatchesByScope(matches, { type: "current_act" })
    expect(r.length).toBe(30)
    expect(r.every((m) => m.actId === "a3")).toBe(true)
  })

  it("previous_acts excludes the current act", () => {
    const r = filterMatchesByScope(matches, { type: "previous_acts" })
    expect(r.length).toBe(50)
    expect(r.some((m) => m.actId === "a3")).toBe(false)
  })

  it("act returns only that act id", () => {
    const r = filterMatchesByScope(matches, { type: "act", actId: "a1" })
    expect(r.length).toBe(20)
    expect(r.every((m) => m.actId === "a1")).toBe(true)
  })

  it("last_matches returns the N most recent by date", () => {
    const r = filterMatchesByScope(matches, { type: "last_matches", count: 20 })
    expect(r.length).toBe(20)
    expect(r.every((m) => m.actId === "a3")).toBe(true)
    // newest first
    expect(new Date(r[0].startedAt).getTime()).toBeGreaterThan(new Date(r[19].startedAt).getTime())
  })
})

describe("groupMatchesByAct", () => {
  it("groups by act id", () => {
    const g = groupMatchesByAct(matches)
    expect(g.get("a3")?.length).toBe(30)
    expect(g.get("a2")?.length).toBe(30)
    expect(g.get("a1")?.length).toBe(20)
  })
})

describe("getAvailableActScopes", () => {
  it("lists acts most recent first with counts and current flag", () => {
    const acts = getAvailableActScopes(matches)
    expect(acts.map((a) => a.actId)).toEqual(["a3", "a2", "a1"])
    expect(acts[0]).toMatchObject({ isCurrent: true, games: 30, label: "Acto 3" })
  })

  it("appends a 'Sin acto detectado' bucket when some matches lack an act", () => {
    const withUnknown = [...matches, { ...mk(1, "", false, ""), actId: null }]
    const acts = getAvailableActScopes(withUnknown)
    const noAct = acts.find((a) => a.label === "Sin acto detectado")
    expect(noAct?.games).toBe(1)
  })
})

describe("normalizeRiotId", () => {
  it("matches UUIDs that differ only in casing/whitespace", () => {
    expect(normalizeRiotId("  ABC-123-DEF  ")).toBe("abc-123-def")
    expect(normalizeRiotId("abc-123-def")).toBe("abc-123-def")
    expect(normalizeRiotId(null)).toBeNull()
    expect(normalizeRiotId("")).toBeNull()
  })
})

describe("filterMatchesByScope act is case-insensitive", () => {
  const mixed = [
    { ...mk(5, "AAAA-1111", false, "Acto X"), actId: "AAAA-1111" },
    { ...mk(4, "aaaa-1111", false, "Acto X"), actId: "aaaa-1111" },
    { ...mk(3, "bbbb-2222", false, "Acto Y"), actId: "bbbb-2222" },
  ]
  it("filters by actId regardless of casing", () => {
    expect(filterMatchesByScope(mixed, { type: "act", actId: "aaaa-1111" }).length).toBe(2)
    expect(filterMatchesByScope(mixed, { type: "act", actId: "AAAA-1111" }).length).toBe(2)
  })
})

describe("no_act scope", () => {
  it("filters matches without a detected act", () => {
    const withUnknown = [...matches, { ...mk(1, "", false, ""), actId: null }]
    expect(filterMatchesByScope(withUnknown, { type: "no_act" }).length).toBe(1)
    expect(resolveScopeFromSearchParams({ scope: "no_act" })).toEqual({ type: "no_act" })
  })
})

describe("resolveScopeFromSearchParams", () => {
  it("parses all/current_act/act/last_matches", () => {
    expect(resolveScopeFromSearchParams({ scope: "all" })).toEqual({ type: "all" })
    expect(resolveScopeFromSearchParams({ scope: "current_act" })).toEqual({ type: "current_act" })
    expect(resolveScopeFromSearchParams({ scope: "act", actId: "a2" })).toEqual({ type: "act", actId: "a2" })
    expect(resolveScopeFromSearchParams({ scope: "last_matches", count: "50" })).toEqual({
      type: "last_matches",
      count: 50,
    })
  })

  it("defaults to all for missing/invalid", () => {
    expect(resolveScopeFromSearchParams({})).toEqual({ type: "all" })
    expect(resolveScopeFromSearchParams({ scope: "bogus" })).toEqual({ type: "all" })
    expect(resolveScopeFromSearchParams({ scope: "last_matches", count: "7" })).toEqual({ type: "all" })
  })
})

describe("getScopeLabel", () => {
  const acts = getAvailableActScopes(matches)
  it("localizes static scopes", () => {
    expect(getScopeLabel({ type: "all" }, "es", acts)).toBe("Todas las partidas sincronizadas")
    expect(getScopeLabel({ type: "all" }, "en", acts)).toBe("All synced matches")
    expect(getScopeLabel({ type: "current_act" }, "es", acts)).toBe("Acto actual")
    expect(getScopeLabel({ type: "last_matches", count: 50 }, "en", acts)).toBe("Last 50")
  })

  it("resolves act label by id", () => {
    expect(getScopeLabel({ type: "act", actId: "a1" }, "es", acts)).toBe("Acto 1")
  })
})
