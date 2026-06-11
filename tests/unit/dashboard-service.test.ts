import { vi } from "vitest"

describe("dashboard service resilience", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns payload when getNormalizedMatches fails in real mode", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => {
          throw new Error("403 from Riot")
        }),
        getPlatformStatus: vi.fn(async () => ({
          name: "EU",
          incidents: [],
          maintenances: [],
        })),
        getCurrentAccount: vi.fn(),
      },
    }))

    vi.doMock("@/lib/env", () => ({
      env: {
        enableMockRiot: false,
        riotRegion: "europe",
        riotPlatform: "eu",
      },
    }))

    const warn = vi.fn()
    vi.doMock("@/lib/logger", () => ({
      getLogger: () => ({
        warn,
      }),
    }))

    const { getDashboardPayload } = await import("@/server/services/dashboard-service")

    const payload = await getDashboardPayload({
      puuid: "puuid-1",
      gameName: "RRumu",
      tagLine: "6969",
    })

    expect(payload.profile.gameName).toBe("RRumu")
    expect(payload.profile.tagLine).toBe("6969")
    expect(payload.recentMatches).toEqual([])
    expect(payload.metadata.matchesFetchFailed).toBe(true)
    expect(payload.metadata.matchesFetchMessage).toBe("Riot devolvio un error al consultar VAL-MATCH-V1.")
    expect(warn).toHaveBeenCalled()
  })

  it("keeps real account identity in payload even when matches fail", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => {
          throw new Error("403 from Riot")
        }),
        getPlatformStatus: vi.fn(async () => ({
          name: "EU",
          incidents: [],
          maintenances: [],
        })),
        getCurrentAccount: vi.fn(),
      },
    }))

    vi.doMock("@/lib/env", () => ({
      env: {
        enableMockRiot: false,
        riotRegion: "europe",
        riotPlatform: "eu",
      },
    }))

    vi.doMock("@/lib/logger", () => ({
      getLogger: () => ({
        warn: vi.fn(),
      }),
    }))

    const { getDashboardPayload } = await import("@/server/services/dashboard-service")

    const payload = await getDashboardPayload({
      puuid: "real-puuid",
      gameName: "RRumu",
      tagLine: "6969",
    })

    expect(payload.profile.puuid).toBe("real-puuid")
    expect(payload.profile.gameName).toBe("RRumu")
    expect(payload.profile.tagLine).toBe("6969")
  })
})
