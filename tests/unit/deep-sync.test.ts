import { describe, expect, it, vi } from "vitest"

import type { MatchPerformance } from "@/types/domain"
import { InMemoryMatchHistoryRepository } from "@/server/valorant/matches/match-history-repository"
import { deepSyncRecentMatches } from "@/server/valorant/matches/deep-sync"

const match = (id: string) => ({ matchId: id, startedAt: "2026-06-01T00:00:00Z", seasonId: "s1" }) as MatchPerformance

describe("deepSyncRecentMatches", () => {
  it("skips existing, saves only the player's matches, scans all queues", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    await repo.saveMatches("u", "p", [match("a")])

    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p" },
      {
        repo,
        getRecentIds: async (q) => (q === "competitive" ? ["a", "b", "c"] : []),
        normalize: async (id) => (id === "b" ? match("b") : null), // c isn't the player's
      },
    )

    expect(result.skippedExisting).toBe(1) // a already synced
    expect(result.matchIdsChecked).toBe(3)
    expect(result.detailsFetched).toBe(2) // b, c
    expect(result.playerMatchesFound).toBe(1) // b
    expect(result.newMatchesSaved).toBe(1)
    expect(result.queuesScanned).toContain("competitive")
  })

  it("hard-caps the number of detail fetches", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p", maxDetails: 3 },
      {
        repo,
        getRecentIds: async (q) => (q === "competitive" ? ["m0", "m1", "m2", "m3", "m4", "m5"] : []),
        normalize: async () => null,
      },
    )
    expect(result.detailsFetched).toBe(3)
  })

  it("stops and flags rateLimited on a 429", async () => {
    const repo = new InMemoryMatchHistoryRepository()
    const result = await deepSyncRecentMatches(
      { userId: "u", puuid: "p" },
      {
        repo,
        getRecentIds: async (q) => (q === "competitive" ? ["x", "y"] : []),
        normalize: async () => {
          throw new Error("Riot API error 429 rate limit")
        },
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
