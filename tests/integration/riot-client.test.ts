import { riotAdapter } from "@/integrations/riot"

describe("riot adapter", () => {
  it("returns account profile in mock mode", async () => {
    const account = await riotAdapter.getCurrentAccount()
    expect(account.puuid).toBeTruthy()
  })

  it("returns normalized matches", async () => {
    const matches = await riotAdapter.getNormalizedMatches()
    expect(matches.length).toBeGreaterThan(10)
    expect(matches[0]?.matchId).toBeTruthy()
  })
})
