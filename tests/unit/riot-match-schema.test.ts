import { riotMatchSchema } from "@/integrations/riot/schemas"

describe("riotMatchSchema", () => {
  it("accepts players without characterName when characterId is present", () => {
    const parsed = riotMatchSchema.parse({
      matchInfo: {
        matchId: "match-1",
        mapId: "ascent",
        gameStartMillis: Date.now(),
        gameLengthMillis: 1800000,
        queueId: "competitive",
        gameMode: "Bomb",
        region: "eu",
      },
      players: [
        {
          puuid: "p-1",
          teamId: "Blue",
          characterId: "agent-uuid-1",
          stats: {
            kills: 10,
            deaths: 8,
            assists: 4,
          },
        },
      ],
      teams: [
        {
          teamId: "Blue",
          won: true,
          roundsWon: 13,
          roundsLost: 9,
        },
      ],
    })

    expect(parsed.players[0]?.characterId).toBe("agent-uuid-1")
    expect(parsed.players[0]?.characterName).toBeUndefined()
  })
})
