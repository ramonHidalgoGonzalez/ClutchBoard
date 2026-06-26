import { describe, expect, it } from "vitest"

import { normalizeMapSlug } from "@/server/valorant/assets/slugs"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import { resolveCanonicalMapName } from "@/lib/valorant-content"
import {
  effectivePageSize,
  limitToParam,
  parseMatchLimit,
} from "@/components/matches/match-history"

describe("Bug 1 — Summit map assets", () => {
  it("normalizes Summit / Plummet / engine path to 'summit'", () => {
    expect(normalizeMapSlug("Summit")).toBe("summit")
    expect(normalizeMapSlug("summit")).toBe("summit")
    expect(normalizeMapSlug("Plummet")).toBe("summit")
    expect(normalizeMapSlug("plummet")).toBe("summit")
    expect(normalizeMapSlug("/Game/Maps/Plummet/Plummet")).toBe("summit")
  })

  it("returns local summit assets for all three contexts", () => {
    expect(getMapAssets("Summit")).toMatchObject({
      thumb: expect.stringContaining("summit.webp"),
      banner: expect.stringContaining("summit.webp"),
      card: expect.stringContaining("summit.webp"),
    })
    // codename also resolves to the same local assets
    expect(getMapAssets("Plummet").thumb).toContain("summit.webp")
  })

  it("resolves the engine path to the display name (no raw path leak)", () => {
    expect(resolveCanonicalMapName("/Game/Maps/Plummet/Plummet")).toBe("Summit")
    expect(resolveCanonicalMapName("Plummet")).toBe("Summit")
  })
})

describe("Bug 2 — match limit selector", () => {
  it("parses the limit param, defaulting to 50", () => {
    expect(parseMatchLimit("10")).toBe(10)
    expect(parseMatchLimit("20")).toBe(20)
    expect(parseMatchLimit("50")).toBe(50)
    expect(parseMatchLimit("all")).toBe(0)
    expect(parseMatchLimit(null)).toBe(50)
    expect(parseMatchLimit("999")).toBe(50)
    expect(parseMatchLimit("abc")).toBe(50)
  })

  it("round-trips to the URL param value", () => {
    expect(limitToParam(0)).toBe("all")
    expect(limitToParam(50)).toBe("50")
    expect(limitToParam(10)).toBe("10")
  })

  it("limits the visible count, expanding 'all' to the full set", () => {
    const total = 104
    const visible = (limit: ReturnType<typeof parseMatchLimit>) => Math.min(total, effectivePageSize(limit, total))
    expect(visible(10)).toBe(10)
    expect(visible(20)).toBe(20)
    expect(visible(50)).toBe(50)
    expect(visible(0)).toBe(104) // all
  })

  it("shows everything filtered when fewer than the limit (7 with limit 50)", () => {
    expect(Math.min(7, effectivePageSize(50, 7))).toBe(7)
  })
})
