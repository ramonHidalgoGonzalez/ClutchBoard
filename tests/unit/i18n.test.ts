import { defaultLocale, normalizeLocale, supportedLocales } from "@/i18n/locales"
import { getDictionaryFor } from "@/i18n/dictionaries"
import { makeT } from "@/i18n/translate"
import { formatPercent, formatQueue, formatResult } from "@/i18n/format"
import { es } from "@/i18n/dictionaries/es"
import { en } from "@/i18n/dictionaries/en"

describe("locales", () => {
  it("defaults to es", () => {
    expect(defaultLocale).toBe("es")
  })

  it("normalizes unsupported locales back to es", () => {
    expect(normalizeLocale("xx")).toBe("es")
    expect(normalizeLocale(undefined)).toBe("es")
  })

  it("accepts supported and BCP-47 forms", () => {
    expect(normalizeLocale("en")).toBe("en")
    expect(normalizeLocale("en-US")).toBe("en")
    expect(supportedLocales).toContain("pt")
  })
})

describe("translate", () => {
  it("returns Spanish text", () => {
    expect(makeT(es)("nav.dashboard")).toBe("Dashboard")
    expect(makeT(es)("matches.victory")).toBe("Victoria")
  })

  it("returns English text", () => {
    expect(makeT(en)("matches.victory")).toBe("Victory")
    expect(makeT(en)("nav.settings")).toBe("Settings")
  })

  it("falls back to Spanish for a missing branch, never undefined", () => {
    // partial dict missing matches.* → falls back to es
    const partial = { ...es, matches: undefined } as unknown as typeof es
    expect(makeT(partial)("matches.victory")).toBe("Victoria")
  })

  it("returns the key (not undefined) when nothing matches", () => {
    expect(makeT(es)("does.not.exist")).toBe("does.not.exist")
  })

  it("interpolates variables", () => {
    expect(makeT(es)("dashboard.welcomeBack", { name: "RRumu" })).toContain("RRumu")
  })
})

describe("format", () => {
  it("translates queue labels per locale", () => {
    expect(formatQueue("competitive", "es")).toBe("Competitivo")
    expect(formatQueue("competitive", "en")).toBe("Competitive")
    expect(formatQueue("deathmatch", "es")).toBe("Deathmatch")
  })

  it("translates result labels per locale", () => {
    expect(formatResult("win", "es")).toBe("Victoria")
    expect(formatResult("loss", "en")).toBe("Defeat")
  })

  it("formats percent per locale", () => {
    expect(formatPercent(50, "en")).toBe("50.0%")
    expect(formatPercent(50, "es")).toContain("50,0")
  })

  it("every dictionary resolves the same keys", () => {
    for (const locale of supportedLocales) {
      const t = makeT(getDictionaryFor(locale))
      expect(t("nav.dashboard")).not.toBe("nav.dashboard")
      expect(t("settings.language")).not.toBe("settings.language")
    }
  })
})
