import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { EntityHeroMini } from "@/components/dashboard/entity-hero-mini"

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("EntityHeroMini", () => {
  it("agent card renders the full-body hero image (not a tiny avatar)", () => {
    render(
      <EntityHeroMini
        kind="agent"
        eyebrow="Agente más jugado"
        name="Breach"
        imageUrl="/game-assets/agents/breach.png"
        winRate={44}
        matches={9}
        href="/agents/breach"
      />,
    )
    const img = screen.getByAltText("Breach") as HTMLImageElement
    expect(img.getAttribute("src")).toBe("/game-assets/agents/breach.png")
    expect(img.className).toContain("agent-hero-image")
    expect(screen.getByText("44% Winrate")).toBeInTheDocument()
    expect(screen.getByText("9 Partidas")).toBeInTheDocument()
  })

  it("map card renders the splash as a banner background", () => {
    const { container } = render(
      <EntityHeroMini
        kind="map"
        eyebrow="Mejor mapa"
        name="Haven"
        imageUrl="https://cdn/haven/splash.png"
        winRate={50}
        matches={6}
        star
        href="/maps/haven"
      />,
    )
    expect(container.innerHTML).toContain("https://cdn/haven/splash.png")
    expect(screen.getByText("Haven")).toBeInTheDocument()
    expect(container.textContent).not.toContain("/Game/Maps")
    expect(container.textContent).not.toContain("undefined")
  })
})
