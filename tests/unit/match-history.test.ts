import { describe, expect, it, vi } from "vitest"

import type { MatchPerformance } from "@/types/domain"
import {
  InMemoryMatchHistoryRepository,
  paginate,
} from "@/server/valorant/matches/match-history-repository"
import { syncValorantMatchHistory } from "@/server/valorant/matches/sync-history"

function mk(id: string, seasonId: string | null, daysAgo: number, queue = "competitive"): MatchPerformance {
  return {
    matchId: id,
    startedAt: new Date(Date.UTC(2026, 0, 1) - daysAgo * 86_400_000).toISOString(),
    durationSeconds: 1800,
    queueId: queue,
    queueName: queue,
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "jett",
    agentName: "Jett",
    outcome: "win",
    roundsWon: 13,
    roundsLost: 7,
    seasonId,
    actId: seasonId,
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

describe("InMemoryMatchHistoryRepository", () => {
  it("saves without duplicating match ids", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const first = await repo.saveMatches("u", "p", [mk("a", "s1", 1), mk("b", "s1", 2)])
    const second = await repo.saveMatches("u", "p", [mk("b", "s1", 2), mk("c", "s2", 3)])
    expect(first).toBe(2)
    expect(second).toBe(1) // only c is new
    expect((await repo.listSyncedMatchIds("p")).size).toBe(3)
    expect((await repo.getAllSyncedMatches("p")).length).toBe(3)
  })

  it("preserves seasonId on persisted matches", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    await repo.saveMatches("u", "p", [mk("a", "season-X", 1)])
    const all = await repo.getAllSyncedMatches("p")
    expect(all[0].seasonId).toBe("season-X")
  })
})

describe("paginate", () => {
  it("orders by date desc and slices the page", () => {
    const matches = [mk("old", "s", 30), mk("new", "s", 1), mk("mid", "s", 10)]
    const page = paginate(matches, { page: 1, pageSize: 2 })
    expect(page.total).toBe(3)
    expect(page.matches.map((m) => m.matchId)).toEqual(["new", "mid"])
  })
})

describe("syncValorantMatchHistory", () => {
  it("saves new matches, keeps seasonId in act coverage, and is idempotent", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const available = [mk("a", "s1", 1), mk("b", "s1", 2), mk("c", "s2", 40, "unrated")]
    const fetchNormalized = vi.fn(async () => available)

    const r1 = await syncValorantMatchHistory({ userId: "u", puuid: "p", mode: "all_available" }, { repo, fetchNormalized })
    expect(r1.savedMatches).toBe(3)
    expect(r1.newMatchIds).toBe(3)
    expect(r1.matchlistReturned).toBe(3)
    expect(r1.oldestSyncedMatchDate).toBeTruthy()

    // Re-running finds nothing new and warns about no older history.
    const r2 = await syncValorantMatchHistory({ userId: "u", puuid: "p", mode: "all_available" }, { repo, fetchNormalized })
    expect(r2.savedMatches).toBe(0)
    expect(r2.newMatchIds).toBe(0)
    expect(r2.warnings.some((w) => w.includes("no ha devuelto partidas más antiguas"))).toBe(true)
  })

  it("respects the maxNewMatches cap", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const available = Array.from({ length: 10 }, (_, i) => mk(`m${i}`, "s1", i))
    const r = await syncValorantMatchHistory(
      { userId: "u", puuid: "p", maxNewMatches: 3 },
      { repo, fetchNormalized: async () => available },
    )
    expect(r.savedMatches).toBe(3)
  })
})

describe("POST /api/valorant/sync-history", () => {
  it("returns 401 without a session", async () => {
    vi.resetModules()
    vi.doMock("@/server/auth/session", () => ({ getCurrentSession: async () => null }))
    const { POST } = await import("@/app/api/valorant/sync-history/route")
    const res = await POST(new Request("http://localhost/api/valorant/sync-history", { method: "POST" }))
    expect(res.status).toBe(401)
    vi.doUnmock("@/server/auth/session")
  })
})
