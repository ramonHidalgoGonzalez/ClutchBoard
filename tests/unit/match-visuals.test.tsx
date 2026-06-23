import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { MatchHistory } from "@/components/matches/match-history"
import type { AnalyticsSummary, MatchPerformance, RecentComparison } from "@/types/domain"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const summary: AnalyticsSummary = {
  totalMatches: 1,
  winRate: 100,
  averageKda: 2,
  averageKills: 20,
  averageDeaths: 10,
  averageAssists: 5,
  averageAcs: 240,
  averageHsPercent: 30,
}

const recentVsPrevious: RecentComparison = {
  available: false,
  recentMatches: 1,
  previousMatches: 0,
  winRateDelta: 0,
  kdaDelta: 0,
  acsDelta: 0,
}

const baseMatch: MatchPerformance = {
  matchId: "match-1234567890",
  startedAt: new Date("2026-06-10T10:00:00.000Z").toISOString(),
  durationSeconds: 1980,
  queueId: "competitive",
  queueName: "Competitive",
  gameMode: "Bomb",
  mapId: "/Game/Maps/Triad/Triad",
  mapName: "Haven",
  mapImageUrl: "https://media.valorant-api.com/maps/haven/splash.png",
  mapIconUrl: "https://media.valorant-api.com/maps/haven/icon.png",
  agentId: "agent-sova",
  agentName: "Sova",
  agentImageUrl: "https://media.valorant-api.com/agents/sova/portrait.png",
  agentIconUrl: "https://media.valorant-api.com/agents/sova/icon.png",
  outcome: "win",
  roundsWon: 13,
  roundsLost: 9,
  kills: 20,
  deaths: 14,
  assists: 7,
  damage: 3200,
  headshots: 18,
  bodyshots: 22,
  legshots: 4,
  firstBloods: 3,
  firstDeaths: 1,
  clutches: 0,
  score: 310,
  acsEstimate: 241,
  headshotPct: 40.5,
  sessionIndex: 1,
  source: "official-riot",
  officialFields: [],
  derivedFields: [],
}

describe("MapThumbnail", () => {
  it("renders the image at the md default size", () => {
    const { container } = render(<MapThumbnail name="Haven" imageUrl="https://x/haven.png" />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain("h-[52px]")
    expect(root.className).toContain("w-[84px]")
    expect(screen.getByAltText("Haven")).toBeInTheDocument()
  })

  it("falls back to a labelled gradient when imageUrl is null", () => {
    render(<MapThumbnail name="Haven" imageUrl={null} />)
    expect(screen.queryByAltText("Haven")).not.toBeInTheDocument()
    expect(screen.getByText("Haven")).toBeInTheDocument()
  })
})

describe("AgentAvatar", () => {
  it("renders the portrait at the md default size", () => {
    const { container } = render(<AgentAvatar name="Sova" imageUrl="https://x/sova.png" />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain("size-12")
    expect(screen.getByAltText("Sova")).toBeInTheDocument()
  })

  it("falls back to initials when imageUrl is null", () => {
    render(<AgentAvatar name="Breach" imageUrl={null} />)
    expect(screen.queryByAltText("Breach")).not.toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("renders the provided local webp avatar", () => {
    render(<AgentAvatar name="Jett" imageUrl="/valorant/agents/avatars/jett.webp" framing="avatar" />)
    const img = screen.getByAltText("Jett") as HTMLImageElement
    expect(img.getAttribute("src")).toBe("/valorant/agents/avatars/jett.webp")
  })
})

describe("MatchHistory visuals", () => {
  it("shows visible map thumbnails and agent portraits with clean names", () => {
    render(
      <MatchHistory matches={[baseMatch]} summary={summary} recentVsPrevious={recentVsPrevious} />,
    )
    expect(screen.getAllByAltText("Haven").length).toBeGreaterThan(0)
    expect(screen.getAllByAltText("Sova").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Haven").length).toBeGreaterThan(0)
  })

  it("renders KDA and score on a single line (no broken wraps)", () => {
    render(
      <MatchHistory matches={[baseMatch]} summary={summary} recentVsPrevious={recentVsPrevious} />,
    )
    // Single text nodes — assert the exact joined strings exist.
    expect(screen.getAllByText("20 / 14 / 7").length).toBeGreaterThan(0)
    expect(screen.getByText("1.93")).toBeInTheDocument()
    expect(screen.getAllByText("13 - 9").length).toBeGreaterThan(0)
  })

  it("never leaks internal paths, undefined or null", () => {
    const { container } = render(
      <MatchHistory matches={[baseMatch]} summary={summary} recentVsPrevious={recentVsPrevious} />,
    )
    expect(container.textContent).not.toContain("/Game/Maps")
    expect(container.textContent).not.toContain("undefined")
    expect(container.textContent).not.toMatch(/\bnull\b/)
  })

  it("renders a mobile card with result, map, agent and KDA", () => {
    render(
      <MatchHistory matches={[baseMatch]} summary={summary} recentVsPrevious={recentVsPrevious} />,
    )
    // Desktop + mobile both in the DOM (visibility is CSS-only).
    expect(screen.getAllByText("VICTORIA").length).toBeGreaterThan(0)
    expect(screen.getAllByAltText("Haven").length).toBeGreaterThan(0)
    expect(screen.getAllByAltText("Sova").length).toBeGreaterThan(0)
  })

  it("does not crash when imagery is missing", () => {
    render(
      <MatchHistory
        matches={[{ ...baseMatch, mapImageUrl: null, mapIconUrl: null, agentImageUrl: null, agentIconUrl: null, agentAvatarUrl: null }]}
        summary={summary}
        recentVsPrevious={recentVsPrevious}
      />,
    )
    expect(screen.getAllByText("Haven").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Sova").length).toBeGreaterThan(0)
  })
})
