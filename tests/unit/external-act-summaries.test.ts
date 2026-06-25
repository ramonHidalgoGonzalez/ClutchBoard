import { describe, expect, it, vi } from "vitest"

// Force the in-memory repository path (this env has a real DATABASE_URL whose
// ExternalActSummary table isn't migrated). Pure logic is what we're testing.
vi.mock("@/database/prisma", () => ({ getPrisma: () => null }))

import type { MatchPerformance } from "@/types/domain"
import {
  parseExternalActCsv,
  validateExternalActInput,
} from "@/server/valorant/analytics/external-act-summaries"
import {
  createExternalActSummary,
  deleteExternalActSummary,
  listExternalActSummaries,
  updateExternalActSummary,
  upsertExternalActSummary,
} from "@/server/repositories/external-act-summary-repository"
import { buildActProgressionRows } from "@/server/valorant/analytics/act-progression"

describe("validateExternalActInput", () => {
  it("accepts a valid summary", () => {
    const r = validateExternalActInput({ actLabel: "Ep 8 // Acto 1", winRate: "52.7", matchesPlayed: "74", wins: "39", losses: "35" })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.winRate).toBe(52.7)
  })
  it("requires actLabel", () => {
    expect(validateExternalActInput({ winRate: 50 })).toMatchObject({ ok: false })
  })
  it("rejects winRate out of range", () => {
    const r = validateExternalActInput({ actLabel: "A", winRate: 150 })
    expect(r.ok).toBe(false)
  })
  it("rejects wins + losses greater than matchesPlayed", () => {
    const r = validateExternalActInput({ actLabel: "A", matchesPlayed: 10, wins: 8, losses: 5 })
    expect(r.ok).toBe(false)
  })
})

describe("parseExternalActCsv", () => {
  it("parses a valid row and tags it external_csv", () => {
    const csv = [
      "actLabel,sourceName,finalRank,peakRank,matchesPlayed,wins,losses,winRate,kda,avgCombatScore,headshotPercent,mainAgent,bestMap,worstMap,notes",
      "Episodio 8 // Acto 1,Blitz,Platino 2,Platino 3,74,39,35,52.7,1.18,214,22,Deadlock,Ascent,Breeze,",
    ].join("\n")
    const r = parseExternalActCsv(csv)
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0]).toMatchObject({ actLabel: "Episodio 8 // Acto 1", sourceName: "Blitz", source: "external_csv", winRate: 52.7 })
  })
  it("reports invalid rows", () => {
    const csv = "actLabel,winRate\n,250"
    const r = parseExternalActCsv(csv)
    expect(r.rows).toHaveLength(0)
    expect(r.errors.length).toBeGreaterThan(0)
  })
})

describe("external act summary repository (in-memory)", () => {
  it("creates, lists, updates, deletes scoped by user", async () => {
    const created = await createExternalActSummary("user-A", "puuid-A", { actLabel: "Ep8A1", sourceName: "Blitz", winRate: 50 })
    expect((await listExternalActSummaries("user-A")).some((s) => s.id === created.id)).toBe(true)
    // another user can't see it
    expect((await listExternalActSummaries("user-B")).some((s) => s.id === created.id)).toBe(false)
    // another user can't edit/delete it
    expect(await updateExternalActSummary(created.id, "user-B", { actLabel: "x" })).toBeNull()
    expect(await deleteExternalActSummary(created.id, "user-B")).toBe(false)
    // owner can
    expect(await deleteExternalActSummary(created.id, "user-A")).toBe(true)
  })

  it("upsert does not duplicate by (user, actLabel, sourceName)", async () => {
    await upsertExternalActSummary("user-C", "puuid-C", { actLabel: "Ep8A2", sourceName: "Blitz", winRate: 40 })
    await upsertExternalActSummary("user-C", "puuid-C", { actLabel: "Ep8A2", sourceName: "Blitz", winRate: 55 })
    const list = (await listExternalActSummaries("user-C")).filter((s) => s.actLabel === "Ep8A2")
    expect(list).toHaveLength(1)
    expect(list[0].winRate).toBe(55)
  })
})

function mk(actId: string, actLabel: string, win: boolean): MatchPerformance {
  return {
    matchId: `m-${actId}-${win}-${Math.round(Math.abs(Math.sin(actId.length)) * 1e6)}`,
    startedAt: "2026-06-01T00:00:00Z",
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
    actLabel,
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
    headshotPct: 25,
    sessionIndex: 1,
    source: "mock-demo",
    officialFields: [],
    derivedFields: [],
  }
}

describe("buildActProgressionRows", () => {
  it("combines real acts and external summaries with source badges", () => {
    const matches = [mk("ep9a1", "Episodio 9 // Acto 1", true), mk("ep9a1", "Episodio 9 // Acto 1", false)]
    const external = [
      {
        id: "x1",
        userId: "u",
        puuid: "p",
        actLabel: "Episodio 8 // Acto 1",
        source: "manual" as const,
        sourceName: "Manual",
        winRate: 53,
        finalRank: "Platino 2",
        createdAt: "",
        updatedAt: "",
      },
    ]
    const rows = buildActProgressionRows(matches, external)
    const real = rows.find((r) => r.isReal)
    const ext = rows.find((r) => !r.isReal)
    expect(real?.badge).toBe("Riot sincronizado")
    expect(real?.games).toBe(2)
    expect(ext?.badge).toBe("Manual")
    expect(ext?.finalRank).toBe("Platino 2")
  })
})

describe("external-act-summaries API", () => {
  it("GET/POST return 401 without a session", async () => {
    vi.resetModules()
    vi.doMock("@/server/auth/session", () => ({ getCurrentSession: async () => null }))
    const { GET, POST } = await import("@/app/api/valorant/external-act-summaries/route")
    expect((await GET()).status).toBe(401)
    const res = await POST(new Request("http://localhost/api/valorant/external-act-summaries", { method: "POST" }))
    expect(res.status).toBe(401)
    vi.doUnmock("@/server/auth/session")
  })
})
