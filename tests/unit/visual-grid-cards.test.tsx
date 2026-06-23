import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { VisualAgentCard } from "@/components/agents/visual-agent-card"
import { VisualMapCard } from "@/components/maps/visual-map-card"
import type { AgentBreakdown, MapBreakdown, MatchPerformance } from "@/types/domain"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const match = (over: Partial<MatchPerformance> = {}): MatchPerformance =>
  ({
    matchId: "m1",
    startedAt: new Date("2026-06-10T10:00:00Z").toISOString(),
    durationSeconds: 1800,
    queueId: "competitive",
    queueName: "Competitive",
    gameMode: "Bomb",
    mapId: "ascent",
    mapName: "Ascent",
    agentId: "jett",
    agentName: "Jett",
    outcome: "win",
    roundsWon: 13,
    roundsLost: 8,
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
    score: 300,
    acsEstimate: 240,
    headshotPct: 30,
    sessionIndex: 1,
    source: "official-riot",
    officialFields: [],
    derivedFields: [],
    ...over,
  }) as MatchPerformance

const agent: AgentBreakdown = {
  agentId: "jett",
  agentName: "Jett",
  matches: 32,
  winRate: 62.5,
  kda: 1.48,
  avgAcs: 236,
  avgDamage: 150,
  consistencyScore: 70,
  impactScore: 70,
  comfortPick: true,
  needsWork: false,
  sampleSize: 32,
  confidence: 1,
  source: "official-riot",
}

const map: MapBreakdown = {
  mapId: "ascent",
  mapName: "Ascent",
  matches: 24,
  winRate: 75,
  kda: 1.62,
  avgAcs: 248,
  avgDamage: 150,
  consistencyScore: 70,
  sampleLabel: "good",
  sampleSize: 24,
  confidence: 1,
  source: "official-riot",
}

describe("VisualAgentCard", () => {
  it("renders a visual card with portrait, name and stats", () => {
    render(<VisualAgentCard agent={agent} matches={[match()]} role="Duelist" />)
    const img = screen.getByAltText("Jett") as HTMLImageElement
    expect(img.getAttribute("src")).toContain("/valorant/agents/card/jett.webp")
    expect(screen.getByText("Jett")).toBeInTheDocument()
    expect(screen.getByText("63%")).toBeInTheDocument() // winrate rounded
    expect(screen.getByText("comfort")).toBeInTheDocument()
  })
})

describe("VisualMapCard", () => {
  it("renders a banner card with map name, stats and badge", () => {
    const { container } = render(
      <VisualMapCard map={map} matches={[match()]} badge={{ label: "Mejor mapa", best: true }} />,
    )
    expect(screen.getByText("Ascent")).toBeInTheDocument()
    expect(screen.getByText("Mejor mapa")).toBeInTheDocument()
    expect(screen.getByText("75%")).toBeInTheDocument()
    // banner/card asset used as background, no internal path
    expect(container.innerHTML).toContain("/valorant/maps/")
    expect(container.textContent).not.toContain("/Game/Maps")
    expect(container.textContent).not.toContain("undefined")
  })
})
