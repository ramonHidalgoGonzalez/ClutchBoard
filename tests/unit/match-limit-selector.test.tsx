import { render, screen, within } from "@testing-library/react"
import { vi } from "vitest"

import { MatchHistory } from "@/components/matches/match-history"
import type { AnalyticsSummary, MatchPerformance, RecentComparison } from "@/types/domain"

// next/link mock: render a plain anchor with only DOM-safe props. The Link-only
// props (replace/scroll/prefetch) are intentionally not forwarded.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    ["aria-current"]: ariaCurrent,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    "aria-current"?: string
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}))

// Controllable URL search params for the route.
let currentSearch = ""
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/matches",
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

const summary: AnalyticsSummary = {
  totalMatches: 60, winRate: 50, averageKda: 2, averageKills: 20,
  averageDeaths: 10, averageAssists: 5, averageAcs: 240, averageHsPercent: 30,
}
const recentVsPrevious: RecentComparison = {
  available: false, recentMatches: 1, previousMatches: 0,
  winRateDelta: 0, kdaDelta: 0, acsDelta: 0,
}

function mk(i: number): MatchPerformance {
  return {
    matchId: `match-${String(i).padStart(4, "0")}`,
    startedAt: new Date(2026, 5, 1, 10, i % 60).toISOString(),
    durationSeconds: 1980, queueId: "competitive", queueName: "Competitive",
    gameMode: "Bomb", mapId: "/Game/Maps/Triad/Triad", mapName: "Haven",
    mapImageUrl: null, mapIconUrl: null, mapThumbImageUrl: null,
    mapBannerImageUrl: null, mapCardImageUrl: null,
    agentId: "agent-sova", agentName: "Sova", agentImageUrl: null, agentIconUrl: null,
    agentTableImageUrl: null, agentCardImageUrl: null, agentHeroImageUrl: null,
    outcome: "win", roundsWon: 13, roundsLost: 9, kills: 20, deaths: 14, assists: 7,
    damage: 3200, headshots: 18, bodyshots: 22, legshots: 4, firstBloods: 3,
    firstDeaths: 1, clutches: 0, score: 310, acsEstimate: 241, headshotPct: 40.5,
    sessionIndex: 1, source: "official-riot", officialFields: [], derivedFields: [],
  }
}

const matches = Array.from({ length: 60 }, (_, i) => mk(i))

function renderAt(search: string) {
  currentSearch = search
  return render(
    <MatchHistory matches={matches} summary={summary} recentVsPrevious={recentVsPrevious} />,
  )
}

// Desktop + mobile both render the paged rows, so each match yields 2 anchors.
function visibleMatchCount() {
  return document.querySelectorAll('a[href^="/matches/match-"]').length / 2
}

function limitGroup() {
  // The pill group is the element whose direct children include 10/20/50/Todas.
  const groups = Array.from(document.querySelectorAll("div")).filter((d) => {
    const labels = Array.from(d.children).map((c) => c.textContent?.trim())
    return ["10", "20", "50", "Todas"].every((l) => labels.includes(l))
  })
  return groups[groups.length - 1] as HTMLElement
}

describe("match limit selector (URL-driven)", () => {
  it("renders each limit as a real link with the right href, preserving other params", () => {
    renderAt("scope=current_act")
    const group = limitGroup()
    const link = (label: string) => within(group).getByText(label).closest("a") as HTMLAnchorElement
    expect(link("10").getAttribute("href")).toBe("/matches?scope=current_act&limit=10")
    expect(link("20").getAttribute("href")).toBe("/matches?scope=current_act&limit=20")
    expect(link("50").getAttribute("href")).toBe("/matches?scope=current_act&limit=50")
    expect(link("Todas").getAttribute("href")).toBe("/matches?scope=current_act&limit=all")
  })

  it("marks the active option from the URL (default 50)", () => {
    renderAt("")
    const group = limitGroup()
    const active = within(group).getByText("50").closest("a")
    expect(active?.getAttribute("aria-current")).toBe("true")
    expect(within(group).getByText("10").closest("a")?.getAttribute("aria-current")).toBeNull()
    expect(visibleMatchCount()).toBe(50)
  })

  it("derives the page size from ?limit= (10)", () => {
    renderAt("limit=10")
    const group = limitGroup()
    expect(within(group).getByText("10").closest("a")?.getAttribute("aria-current")).toBe("true")
    expect(visibleMatchCount()).toBe(10)
    expect(screen.getByText(/Mostrando 1 a 10 de 60/)).toBeInTheDocument()
  })

  it("expands ?limit=all to the full set", () => {
    renderAt("limit=all")
    const group = limitGroup()
    expect(within(group).getByText("Todas").closest("a")?.getAttribute("aria-current")).toBe("true")
    expect(visibleMatchCount()).toBe(60)
    expect(screen.getByText(/Mostrando todas las 60 partidas/)).toBeInTheDocument()
  })
})
