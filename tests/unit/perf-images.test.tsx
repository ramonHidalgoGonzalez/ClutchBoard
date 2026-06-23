import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MatchHistoryRow } from "@/components/matches/match-history-row"
import { I18nProvider } from "@/i18n/provider"
import { es } from "@/i18n/dictionaries/es"
import { DashboardSkeleton, RankedSkeleton } from "@/components/skeletons"
import type { MatchPerformance } from "@/types/domain"

const match: MatchPerformance = {
  matchId: "m1",
  startedAt: new Date(2026, 0, 1).toISOString(),
  durationSeconds: 1800,
  queueId: "competitive",
  queueName: "Competitive",
  gameMode: "Bomb",
  mapId: "ascent",
  mapName: "Ascent",
  mapImageUrl: "/maps/splash.png",
  mapThumbImageUrl: "/maps/thumb.png",
  mapBannerImageUrl: "/maps/banner.png",
  agentId: "jett",
  agentName: "Jett",
  agentImageUrl: "/agents/remote.png",
  agentTableImageUrl: "/agents/table.png",
  agentHeroImageUrl: "/agents/hero.png",
  outcome: "win",
  roundsWon: 13,
  roundsLost: 7,
  kills: 20,
  deaths: 12,
  assists: 5,
  damage: 3000,
  headshots: 10,
  bodyshots: 20,
  legshots: 2,
  firstBloods: 2,
  firstDeaths: 1,
  clutches: 0,
  score: 250,
  acsEstimate: 220,
  headshotPct: 30,
  sessionIndex: 1,
  source: "mock-demo",
  officialFields: [],
  derivedFields: [],
}

describe("match history image context", () => {
  it("uses compact table/thumb assets, never hero/banner art", () => {
    const { container } = render(
      <I18nProvider locale="es" dictionary={es}>
        <MatchHistoryRow match={match} />
      </I18nProvider>,
    )
    const srcs = Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"))
    expect(srcs).toContain("/agents/table.png")
    expect(srcs).toContain("/maps/thumb.png")
    expect(srcs).not.toContain("/agents/hero.png")
    expect(srcs).not.toContain("/maps/banner.png")
  })
})

describe("skeletons", () => {
  it("render without crashing and without undefined/null text", () => {
    const a = render(<DashboardSkeleton />)
    const b = render(<RankedSkeleton />)
    expect(a.container.textContent ?? "").not.toMatch(/undefined|null/)
    expect(b.container.querySelectorAll("div").length).toBeGreaterThan(0)
  })
})
