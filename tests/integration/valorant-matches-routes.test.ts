import { NextRequest } from "next/server"
import { vi } from "vitest"

describe("/api/valorant/matches", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns 401 when session is missing", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => null),
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(),
      },
    }))

    const route = await import("@/app/api/valorant/matches/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches")
    const response = await route.GET(request)

    expect(response.status).toBe(401)
  })

  it("uses authenticated session puuid and ignores arbitrary puuid query param", async () => {
    const getNormalizedMatches = vi.fn(async () => [])

    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => ({
        userId: "user-1",
        puuid: "session-puuid",
        gameName: "RRumu",
        tagLine: "6969",
      })),
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches,
      },
    }))

    const route = await import("@/app/api/valorant/matches/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches?puuid=attacker&limit=12")
    const response = await route.GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(getNormalizedMatches).toHaveBeenCalledWith("session-puuid", 12)
    expect(body.authenticated).toBe(true)
    expect(body.account.puuid).toBe("session-puuid")
  })

  it("returns 429 when Riot API is rate limited", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => ({
        userId: "user-1",
        puuid: "session-puuid",
        gameName: "RRumu",
        tagLine: "6969",
      })),
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches: vi.fn(async () => {
          throw new Error("rate limited")
        }),
      },
    }))

    vi.doMock("@/integrations/riot/client", () => ({
      normalizeRiotApiError: vi.fn(() => ({
        status: 429,
        code: "riot_rate_limited",
        message: "Riot request failed",
      })),
    }))

    const route = await import("@/app/api/valorant/matches/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches")
    const response = await route.GET(request)
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body).toEqual({
      error: "riot_match_fetch_failed",
      status: 429,
      message: "Could not load Valorant matches from Riot API.",
    })
  })

  it("keeps mock mode working", async () => {
    const getNormalizedMatches = vi.fn(async () => [
      {
        matchId: "mock-1",
        startedAt: new Date().toISOString(),
      },
    ])

    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => ({
        userId: "user-1",
        puuid: "mock-puuid",
        gameName: "Demo",
        tagLine: "0000",
      })),
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getNormalizedMatches,
      },
    }))

    const route = await import("@/app/api/valorant/matches/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches")
    const response = await route.GET(request)

    expect(response.status).toBe(200)
    expect(getNormalizedMatches).toHaveBeenCalledWith("mock-puuid", 10)
  })
})

describe("/api/valorant/matches/[matchId]", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns 401 when session is missing", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => null),
    }))

    const route = await import("@/app/api/valorant/matches/[matchId]/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches/test")
    const response = await route.GET(request, { params: Promise.resolve({ matchId: "test" }) })

    expect(response.status).toBe(401)
  })

  it("returns match with fallback agent when Riot player has characterId but no characterName", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => ({
        userId: "user-1",
        puuid: "session-puuid",
        gameName: "RRumu",
        tagLine: "6969",
      })),
    }))

    vi.doMock("@/lib/env", () => ({
      env: {
        enableMockRiot: false,
      },
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getMatchById: vi.fn(async () => ({
          matchInfo: {
            matchId: "match-1",
            mapId: "ascent",
            gameStartMillis: Date.now(),
            gameLengthMillis: 1800000,
            queueId: "competitive",
            gameMode: "Bomb",
            region: "eu",
          },
          players: [
            {
              puuid: "session-puuid",
              teamId: "Blue",
              characterId: "123e4567-agent",
              stats: {
                kills: 18,
                deaths: 12,
                assists: 6,
              },
            },
          ],
          teams: [
            {
              teamId: "Blue",
              won: true,
              roundsWon: 13,
              roundsLost: 8,
            },
          ],
        })),
      },
    }))

    const route = await import("@/app/api/valorant/matches/[matchId]/route")
    const request = new NextRequest("http://localhost:3000/api/valorant/matches/match-1")
    const response = await route.GET(request, { params: Promise.resolve({ matchId: "match-1" }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.match.agentName).toBe("123e4567-agent")
  })
})
