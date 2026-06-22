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

  it("enriches matches with Riot content images", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => createMockMatches(10)),
        getContent: vi.fn(async () => ({
          version: "1",
          characters: [
            {
              id: "jett",
              name: "Jett",
              displayName: "Jett",
              displayIcon: "https://media.valorant-api.com/agents/jett/icon.png",
              fullPortrait: "https://media.valorant-api.com/agents/jett/portrait.png",
            },
            {
              id: "sova",
              name: "Sova",
              displayName: "Sova",
              displayIcon: "https://media.valorant-api.com/agents/sova/icon.png",
              fullPortrait: "https://media.valorant-api.com/agents/sova/portrait.png",
            },
          ],
          maps: [
            {
              id: "ascent",
              name: "Ascent",
              displayName: "Ascent",
              mapUrl: "/Game/Maps/Ascent/Ascent",
              splash: "https://media.valorant-api.com/maps/ascent/splash.png",
              listViewIcon: "https://media.valorant-api.com/maps/ascent/icon.png",
            },
            {
              id: "bind",
              name: "Bind",
              displayName: "Bind",
              mapUrl: "/Game/Maps/Bind/Bind",
              splash: "https://media.valorant-api.com/maps/bind/splash.png",
              listViewIcon: "https://media.valorant-api.com/maps/bind/icon.png",
            },
          ],
          acts: [],
        })),
      },
    }))

    const { getAnalyticsPayload: getPayload } = await import("@/server/services/analytics-service")
    const result = await getPayload("puuid-1")

    expect(result.filteredMatches.some((match) => Boolean(match.mapImageUrl))).toBe(true)
    expect(result.filteredMatches.some((match) => Boolean(match.agentImageUrl))).toBe(true)
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
