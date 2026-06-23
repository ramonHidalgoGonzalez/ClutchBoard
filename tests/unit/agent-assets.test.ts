import {
  getAgentAssets,
  normalizeAgentSlug,
  resolveAgentVisual,
} from "@/server/valorant/content/agent-assets"

describe("normalizeAgentSlug", () => {
  it("removes slashes and special characters", () => {
    expect(normalizeAgentSlug("KAY/O")).toBe("kayo")
  })

  it("lowercases simple names", () => {
    expect(normalizeAgentSlug("Jett")).toBe("jett")
    expect(normalizeAgentSlug("Deadlock")).toBe("deadlock")
    expect(normalizeAgentSlug("Brimstone")).toBe("brimstone")
    expect(normalizeAgentSlug("Clove")).toBe("clove")
    expect(normalizeAgentSlug("Tejo")).toBe("tejo")
  })
})

describe("getAgentAssets", () => {
  it("returns the local optimized asset for a known agent", () => {
    const jett = getAgentAssets("Jett")
    expect(jett).not.toBeNull()
    expect(jett?.avatar).toBe("/valorant/agents/avatars/jett.webp")
    expect(jett?.portrait).toBe("/valorant/agents/portraits/jett.webp")
  })

  it("resolves by slug and by display name equally", () => {
    expect(getAgentAssets("kayo")?.avatar).toBe("/valorant/agents/avatars/kayo.webp")
    expect(getAgentAssets("KAY/O")?.avatar).toBe("/valorant/agents/avatars/kayo.webp")
  })

  it("returns null for an unknown agent", () => {
    expect(getAgentAssets("Definitely Not An Agent")).toBeNull()
  })
})

describe("resolveAgentVisual", () => {
  it("maps characterName -> slug -> local asset", () => {
    const visual = resolveAgentVisual("Sova")
    expect(visual.slug).toBe("sova")
    expect(visual.avatar).toBe("/valorant/agents/avatars/sova.webp")
    expect(visual.portrait).toBe("/valorant/agents/portraits/sova.webp")
    expect(visual.banner).toBeNull()
  })

  it("falls back to the legacy bundled portrait when unmapped", () => {
    const visual = resolveAgentVisual("Brand New Agent")
    expect(visual.avatar).toBe("/game-assets/agents/brand-new-agent.png")
    expect(visual.banner).toBeNull()
  })
})
