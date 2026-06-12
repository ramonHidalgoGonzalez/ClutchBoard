/* eslint-disable @next/next/no-img-element */

import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { MatchTable } from "@/features/matches/match-table"
import type { MatchPerformance } from "@/types/domain"

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => <img alt={typeof alt === "string" ? alt : ""} {...props} />,
}))

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const baseMatch: MatchPerformance = {
  matchId: "match-1234567890",
  startedAt: new Date("2026-06-10T10:00:00.000Z").toISOString(),
  durationSeconds: 1980,
  queueId: "competitive",
  queueName: "Competitive",
  gameMode: "Bomb",
  mapId: "/Game/Maps/Foxtrot/Foxtrot",
  mapName: "/Game/Maps/Foxtrot/Foxtrot",
  mapImageUrl: "https://media.valorant-api.com/maps/foxtrot/splash.png",
  mapIconUrl: "https://media.valorant-api.com/maps/foxtrot/icon.png",
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

describe("match-table", () => {
  it("renders map and agent visuals with clean names", () => {
    render(<MatchTable matches={[baseMatch]} />)

    expect(screen.getAllByAltText("Foxtrot").length).toBeGreaterThan(0)
    expect(screen.getAllByAltText("Sova").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Foxtrot").length).toBeGreaterThan(0)
    expect(screen.queryByText("/Game/Maps/Foxtrot/Foxtrot")).not.toBeInTheDocument()
  })

  it("shows visual fallbacks when images are missing", () => {
    render(
      <MatchTable
        matches={[
          {
            ...baseMatch,
            mapImageUrl: null,
            mapIconUrl: null,
            agentImageUrl: null,
            agentIconUrl: null,
            agentName: "Breach",
          },
        ]}
      />,
    )

    expect(screen.getAllByText("Foxtrot").length).toBeGreaterThan(0)
    expect(screen.getAllByText("B").length).toBeGreaterThan(0)
  })
})
