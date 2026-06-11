import { mapRiotMatchToPerformance } from "@/integrations/riot/mapper"
import type { RiotMatchDto } from "@/types/riot"

function buildMatch(playerOverrides: Partial<RiotMatchDto["players"][number]> = {}): RiotMatchDto {
  return {
    matchInfo: {
      matchId: "match-1",
      mapId: "map-uuid-1",
      gameStartMillis: Date.now(),
      gameLengthMillis: 1800000,
      queueId: "competitive",
      gameMode: "Bomb",
      region: "eu",
    },
    players: [
      {
        puuid: "session-puuid",
        teamId: "Blue",
        characterId: "agent-uuid-1",
        stats: {
          kills: 20,
          deaths: 10,
          assists: 5,
        },
        ...playerOverrides,
      },
    ],
    teams: [
      {
        teamId: "Blue",
        won: true,
        roundsWon: 13,
        roundsLost: 7,
      },
    ],
  }
}

describe("mapRiotMatchToPerformance", () => {
  it("returns fallback agent label when characterName is missing and no resolver exists", () => {
    const match = buildMatch({ characterName: undefined, characterId: "agent-uuid-1" })

    const mapped = mapRiotMatchToPerformance(match, "session-puuid")

    expect(mapped).not.toBeNull()
    expect(mapped?.agentName).toBe("agent-uuid-1")
  })

  it("resolves agent label from content resolver when characterName is missing", () => {
    const match = buildMatch({ characterName: undefined, characterId: "agent-uuid-1" })

    const mapped = mapRiotMatchToPerformance(match, "session-puuid", {
      resolveAgentName: (id) => (id === "agent-uuid-1" ? "Jett" : undefined),
      resolveMapName: (id) => (id === "map-uuid-1" ? "Ascent" : undefined),
    })

    expect(mapped).not.toBeNull()
    expect(mapped?.agentName).toBe("Jett")
    expect(mapped?.mapName).toBe("Ascent")
  })
})
