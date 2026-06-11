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

  it("accepts teams without roundsLost", () => {
    const parsed = riotMatchSchema.parse({
      matchInfo: {
        matchId: "match-2",
        mapId: "bind",
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
            kills: 12,
            deaths: 10,
            assists: 3,
          },
        },
      ],
      teams: [
        {
          teamId: "Blue",
          roundsWon: 13,
          roundsPlayed: 22,
        },
      ],
    })

    expect(parsed.teams[0]?.roundsLost).toBeUndefined()
    expect(parsed.teams[0]?.roundsPlayed).toBe(22)
  })
})
