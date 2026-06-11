import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { RecentMatchesPanel } from "@/features/matches/recent-matches-panel"

vi.mock("@/features/matches/match-table", () => ({
  MatchTable: () => <div>table</div>,
}))

describe("recent matches panel", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows error state when Riot match endpoint fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "riot_match_fetch_failed",
        status: 403,
        message: "Could not load Valorant matches from Riot API.",
      }),
    } as Response)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <RecentMatchesPanel />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          "No se pudieron cargar las partidas. Riot devolvio un error al consultar VAL-MATCH-V1. Tu cuenta esta conectada correctamente.",
        ),
      ).toBeInTheDocument()
    })
  })
})
