import { createMockMatches } from "@/integrations/riot/mock-data"
import { vi } from "vitest"

describe("analytics-service", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("calculates winrate and KDA summary", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(20)),
      },
    }))

    const { getAnalyticsPayload: getPayload } = await import("@/server/services/analytics-service")
    const result = await getPayload("puuid-1")

    expect(result.summary.totalMatches).toBeGreaterThan(0)
    expect(result.summary.winRate).toBeGreaterThanOrEqual(0)
    expect(result.summary.averageKda).toBeGreaterThan(0)
  })

  it("builds mapStats and agentStats", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(24)),
      },
    }))

    const { getAnalyticsPayload: getPayload } = await import("@/server/services/analytics-service")
    const result = await getPayload("puuid-1")

    expect(result.mapStats.length).toBeGreaterThan(0)
    expect(result.agentStats.length).toBeGreaterThan(0)
    expect(result.mapStats[0]?.matches).toBeGreaterThan(0)
    expect(result.agentStats[0]?.matches).toBeGreaterThan(0)
  })

  it("returns recentVsPrevious when enough sample exists", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(30)),
      },
    }))

    const { getAnalyticsPayload: getPayload } = await import("@/server/services/analytics-service")
    const result = await getPayload("puuid-1")

    expect(result.recentVsPrevious.available).toBe(true)
  })

  it("generates sample warnings for low sample", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(3)),
      },
    }))

    const { getAnalyticsPayload: getPayload } = await import("@/server/services/analytics-service")
    const result = await getPayload("puuid-1")

    expect(result.smallSampleWarnings.length).toBeGreaterThan(0)
  })
})
