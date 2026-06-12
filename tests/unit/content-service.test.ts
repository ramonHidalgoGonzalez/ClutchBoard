import { vi } from "vitest"

describe("content-service", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it("maps agent ids and internal map paths to visual content", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getContent: vi.fn(async () => ({
          version: "1",
          characters: [
            {
              id: "agent-id-1",
              name: "Jett",
              displayName: "Jett",
              displayIcon: "https://media.valorant-api.com/agents/jett/icon.png",
              fullPortrait: "https://media.valorant-api.com/agents/jett/portrait.png",
            },
          ],
          maps: [
            {
              id: "map-id-1",
              name: "Foxtrot",
              displayName: "Foxtrot",
              mapUrl: "/Game/Maps/Foxtrot/Foxtrot",
              splash: "https://media.valorant-api.com/maps/foxtrot/splash.png",
              listViewIcon: "https://media.valorant-api.com/maps/foxtrot/icon.png",
            },
          ],
          acts: [],
        })),
      },
    }))

    const { getContentCatalog, resolveAgentContent, resolveMapContent } = await import("@/server/services/content-service")
    const catalog = await getContentCatalog(true)

    const agent = resolveAgentContent(catalog, "agent-id-1")
    const map = resolveMapContent(catalog, "/Game/Maps/Foxtrot/Foxtrot")

    expect(agent?.displayName).toBe("Jett")
    expect(agent?.fullPortraitUrl).toContain("portrait")
    expect(map?.displayName).toBe("Foxtrot")
    expect(map?.splashUrl).toContain("splash")
  })

  it("returns fallback visuals if content provider fails", async () => {
    vi.doMock("@/integrations/riot", () => ({
      riotAdapter: {
        getContent: vi.fn(async () => {
          throw new Error("content unavailable")
        }),
      },
    }))

    const { getContentCatalog } = await import("@/server/services/content-service")
    const catalog = await getContentCatalog(true)

    expect(catalog.version).toBeTruthy()
    expect(Array.isArray(catalog.agents)).toBe(true)
    expect(Array.isArray(catalog.maps)).toBe(true)
  })
})
