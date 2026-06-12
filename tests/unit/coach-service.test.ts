import { vi } from "vitest"

import { createMockMatches } from "@/integrations/riot/mock-data"

describe("coach-service", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("returns insufficient data insight for tiny sample", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(3)),
      },
    }))

    const { getCoachInsights } = await import("@/server/services/coach-service")
    const insights = await getCoachInsights("puuid-1")

    expect(insights[0]?.category).toBe("sample_size")
  })

  it("returns map and agent insights with enough sample", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(28)),
      },
    }))

    const { getCoachInsights } = await import("@/server/services/coach-service")
    const insights = await getCoachInsights("puuid-1")

    expect(insights.length).toBeGreaterThan(1)
    expect(insights.some((item) => item.category === "map" || item.category === "agent")).toBe(true)
  })
})
