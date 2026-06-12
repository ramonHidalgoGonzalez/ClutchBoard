/* eslint-disable @next/next/no-img-element */

import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { AgentPortraitCard } from "@/components/dashboard/agent-portrait-card"
import { MapHeroCard } from "@/components/dashboard/map-hero-card"
import type { AgentBreakdown, MapBreakdown } from "@/types/domain"

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => <img alt={typeof alt === "string" ? alt : ""} {...props} />,
}))

const agent: AgentBreakdown = {
  agentId: "agent-sova",
  agentName: "Sova",
  agentImageUrl: "https://media.valorant-api.com/agents/sova/portrait.png",
  agentIconUrl: "https://media.valorant-api.com/agents/sova/icon.png",
  matches: 9,
  winRate: 56.2,
  kda: 1.31,
  avgAcs: 228,
  avgDamage: 145,
  consistencyScore: 74,
  impactScore: 67,
  comfortPick: true,
  needsWork: false,
  sampleSize: 9,
  confidence: 0.75,
  source: "official-riot",
}

const map: MapBreakdown = {
  mapId: "foxtrot-id",
  mapName: "/Game/Maps/Foxtrot/Foxtrot",
  mapImageUrl: "https://media.valorant-api.com/maps/foxtrot/splash.png",
  mapIconUrl: "https://media.valorant-api.com/maps/foxtrot/icon.png",
  matches: 8,
  winRate: 62.5,
  kda: 1.22,
  avgAcs: 214,
  avgDamage: 138,
  consistencyScore: 69,
  sampleLabel: "good",
  sampleSize: 8,
  confidence: 0.75,
  source: "official-riot",
}

describe("visual cards", () => {
  it("renders agent card with image and stats", () => {
    render(<AgentPortraitCard agent={agent} />)

    expect(screen.getByAltText("Sova")).toBeInTheDocument()
    expect(screen.getByText("comfort pick")).toBeInTheDocument()
    expect(screen.getByText("56.2%")).toBeInTheDocument()
  })

  it("renders map card with clean label and no internal path leakage", () => {
    render(<MapHeroCard map={map} />)

    expect(screen.getByText("Foxtrot")).toBeInTheDocument()
    expect(screen.queryByText("/Game/Maps/Foxtrot/Foxtrot")).not.toBeInTheDocument()
    expect(screen.getByText("sample good")).toBeInTheDocument()
  })

  it("renders map fallback card when no image exists", () => {
    render(<MapHeroCard map={{ ...map, mapImageUrl: null, mapIconUrl: null }} />)

    expect(screen.getByText("Foxtrot")).toBeInTheDocument()
  })
})
