import { NextRequest } from "next/server"
import { vi } from "vitest"

describe("riot callback route", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  async function loadCallbackRoute(options: {
    stateValid?: boolean
    hasRso?: boolean
    exchangeFails?: boolean
    accountFails?: boolean
  } = {}) {
    const {
      stateValid = true,
      hasRso = true,
      exchangeFails = false,
      accountFails = false,
    } = options

    const exchangeCodeForTokens = vi.fn(async () => {
      if (exchangeFails) {
        throw new Error("exchange failed")
      }

      return {
        access_token: "access-token",
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid",
      }
    })

    const getCurrentAccount = vi.fn(async () => {
      if (accountFails) {
        throw new Error("accounts/me failed")
      }

      return {
        puuid: "puuid-1",
        gameName: "Player",
        tagLine: "EUW",
      }
    })

    vi.doMock("@/lib/env", () => ({
      env: {
        enableMockRiot: false,
        appUrl: "http://localhost:3000",
      },
      hasRsoClientCredentials: () => hasRso,
    }))

    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        exchangeCodeForTokens,
        getCurrentAccount,
      },
    }))

    vi.doMock("@/server/auth/rso", () => ({
      verifyRiotState: vi.fn(async () => stateValid),
    }))

    vi.doMock("@/server/repositories/user-repository", () => ({
      findOrCreateUserFromRiotAccount: vi.fn(async () => ({
        user: { id: "user-1" },
      })),
    }))

    vi.doMock("@/server/auth/session", () => ({
      createAppSession: vi.fn(async () => "session"),
    }))

    vi.doMock("@/lib/logger", () => ({
      getLogger: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    }))

    const route = await import("@/app/api/auth/riot/callback/route")
    return {
      route,
      exchangeCodeForTokens,
      getCurrentAccount,
    }
  }

  it("redirects to login with error=code when callback has no code", async () => {
    const { route } = await loadCallbackRoute()

    const request = new NextRequest("http://localhost:3000/api/auth/riot/callback?state=ok")
    const response = await route.GET(request)

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=code")
  })

  it("redirects to login with error=state when state is invalid", async () => {
    const { route } = await loadCallbackRoute({ stateValid: false })

    const request = new NextRequest("http://localhost:3000/api/auth/riot/callback?state=bad&code=123")
    const response = await route.GET(request)

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=state")
  })

  it("redirects to login with error=rso_account when token exchange works but accounts/me fails", async () => {
    const { route, exchangeCodeForTokens, getCurrentAccount } = await loadCallbackRoute({
      accountFails: true,
    })

    const request = new NextRequest("http://localhost:3000/api/auth/riot/callback?state=ok&code=123")
    const response = await route.GET(request)

    expect(exchangeCodeForTokens).toHaveBeenCalledWith("123")
    expect(getCurrentAccount).toHaveBeenCalled()
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=rso_account")
  })
})

describe("/api/me route", () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("returns authenticated true with account when session exists", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => ({
        puuid: "puuid-1",
        gameName: "Player",
        tagLine: "EUW",
      })),
    }))

    const route = await import("@/app/api/me/route")
    const response = await route.GET()
    const body = await response.json()

    expect(body).toEqual({
      authenticated: true,
      account: {
        puuid: "puuid-1",
        gameName: "Player",
        tagLine: "EUW",
      },
    })
  })

  it("returns authenticated false when session does not exist", async () => {
    vi.doMock("@/server/auth/session", () => ({
      getCurrentSession: vi.fn(async () => null),
    }))

    const route = await import("@/app/api/me/route")
    const response = await route.GET()
    const body = await response.json()

    expect(body).toEqual({
      authenticated: false,
      account: null,
    })
  })
})
