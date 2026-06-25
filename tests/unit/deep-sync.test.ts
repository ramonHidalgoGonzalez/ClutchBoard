import { describe, expect, it, vi } from "vitest"

import type { MatchPerformance } from "@/types/domain"
import { InMemoryMatchHistoryRepository } from "@/server/valorant/matches/match-history-repository"
import { deepSyncRecentMatches } from "@/server/valorant/matches/deep-sync"
import type { DeepSyncCheckedCache } from "@/server/valorant/matches/deep-sync-cache"

const match = (id: string) => ({ matchId: id, startedAt: "2026-06-01T00:00:00Z", seasonId: "s1" }) as MatchPerformance

function fakeCache(): DeepSyncCheckedCache {
  const set = new Set<string>()
  return { has: (id) => set.has(id), add: (id) => void set.add(id) }
}

describe("deepSyncRecentMatches", () => {
  it("splits the budget per queue instead of draining the first one", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const recent: Record<string, string[]> = {
      competitive: ["c0", "c1", "c2", "c3", "c4"],
      unrated: ["u0", "u1", "u2", "u3", "u4"],
      swiftplay: ["s0", "s1", "s2", "s3", "s4"],
    }
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", queues: ["competitive", "unrated", "swiftplay"], maxDetailsPerQueue: 2 },
      { repo, getRecentIds: async (q) => recent[q] ?? [], normalize: async () => null, checkedCache: fakeCache() },
    )
    expect(result.queuesScanned).toEqual(["competitive", "unrated", "swiftplay"])
    expect(result.perQueue.map((q) => q.detailsFetched)).toEqual([2, 2, 2])
    expect(result.detailsFetched).toBe(6)
  })

  it("stops at the total budget across queues", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", queues: ["competitive", "unrated"], maxDetailsPerQueue: 20, maxTotalDetails: 3 },
      {
        repo,
        getRecentIds: async (q) => (q === "competitive" ? ["c0", "c1", "c2", "c3", "c4"] : ["u0", "u1"]),
        normalize: async () => null,
        checkedCache: fakeCache(),
      },
    )
    expect(result.detailsFetched).toBe(3)
    expect(result.reachedTotalLimit).toBe(true)
    expect(result.queuesScanned).toEqual(["competitive"]) // never reached unrated
  })

  it("saves only the player's matches and skips already-synced ids", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    await repo.saveMatches("u", "p", [match("c0")])
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", queues: ["competitive"] },
      {
        repo,
        getRecentIds: async () => ["c0", "c1", "c2"],
        normalize: async (id) => (id === "c1" ? match("c1") : null),
        checkedCache: fakeCache(),
      },
    )
    expect(result.skippedExisting).toBe(1) // c0
    expect(result.playerMatchesFound).toBe(1) // c1
    expect(result.newMatchesSaved).toBe(1)
  })

  it("does not re-download ids already checked as non-player", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const cache = fakeCache()
    cache.add("c1") // previously checked, not the player's
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", queues: ["competitive"] },
      { repo, getRecentIds: async () => ["c1", "c2"], normalize: async () => null, checkedCache: cache },
    )
    expect(result.detailsFetched).toBe(1) // only c2 fetched
    expect(result.skippedExisting).toBe(1) // c1 skipped via cache
  })

  it("stops and flags rateLimited on a 429", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", queues: ["competitive"] },
      {
        repo,
        getRecentIds: async () => ["x", "y"],
        normalize: async () => {
          throw new Error("Riot API error 429 rate limit")
        },
        checkedCache: fakeCache(),
      },
    )
    expect(result.rateLimited).toBe(true)
    expect(result.newMatchesSaved).toBe(0)
  })
})

describe("POST /api/valorant/deep-sync-recent", () => {
  it("returns 401 without a session", async () => {
    vi.resetModules()
    vi.doMock("@/server/auth/session", () => ({ getCurrentSession: async () => null }))
    const { POST } = await import("@/app/api/valorant/deep-sync-recent/route")
    const res = await POST(new Request("http://localhost/api/valorant/deep-sync-recent", { method: "POST" }))
    expect(res.status).toBe(401)
    vi.doUnmock("@/server/auth/session")
  })
})
