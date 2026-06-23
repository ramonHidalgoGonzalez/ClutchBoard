import { getAgentAssets, normalizeAgentSlug } from "@/server/valorant/assets/agent-assets"
import { getMapAssets, normalizeMapSlug } from "@/server/valorant/assets/map-assets"

describe("slugs", () => {
  it("normalizeAgentSlug removes slashes and special characters", () => {
    expect(normalizeAgentSlug("KAY/O")).toBe("kayo")
    expect(normalizeAgentSlug("Breach")).toBe("breach")
    expect(normalizeAgentSlug("Brimstone")).toBe("brimstone")
    expect(normalizeAgentSlug("Deadlock")).toBe("deadlock")
  })

  it("normalizeMapSlug lowercases and strips paths/extensions", () => {
    expect(normalizeMapSlug("Haven")).toBe("haven")
    expect(normalizeMapSlug("Icebox")).toBe("icebox")
    expect(normalizeMapSlug("Pearl")).toBe("pearl")
    expect(normalizeMapSlug("/Game/Maps/Triad/Triad")).toBe("triad")
    expect(normalizeMapSlug("ascent.png")).toBe("ascent")
  })
})

describe("getAgentAssets", () => {
  it("returns curated local paths by context for a known agent", () => {
    const a = getAgentAssets("Breach")
    expect(a.table).toBe("/valorant/agents/table/breach.webp")
    expect(a.card).toBe("/valorant/agents/card/breach.webp")
    expect(a.hero).toBe("/valorant/agents/hero/breach.webp")
    // contexts must be distinct (no single image reused everywhere)
    expect(a.table).not.toBe(a.hero)
  })

  it("resolves by display name with special characters", () => {
    expect(getAgentAssets("KAY/O").table).toBe("/valorant/agents/table/kayo.webp")
  })

  it("returns nulls for an unknown agent (caller falls back)", () => {
    const a = getAgentAssets("Definitely Not An Agent")
    expect(a.table).toBeNull()
    expect(a.card).toBeNull()
    expect(a.hero).toBeNull()
  })
})

describe("getMapAssets", () => {
  it("returns curated local paths by context for a known map", () => {
    const m = getMapAssets("Haven")
    expect(m.thumb).toBe("/valorant/maps/thumb/haven.webp")
    expect(m.banner).toBe("/valorant/maps/banner/haven.webp")
    expect(m.card).toBe("/valorant/maps/card/haven.webp")
    expect(m.thumb).not.toBe(m.banner)
  })

  it("returns nulls for an unknown map", () => {
    const m = getMapAssets("Nonexistent Map")
    expect(m.thumb).toBeNull()
    expect(m.banner).toBeNull()
    expect(m.card).toBeNull()
  })
})
