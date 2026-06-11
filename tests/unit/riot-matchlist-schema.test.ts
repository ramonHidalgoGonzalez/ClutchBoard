import { riotMatchListSchema } from "@/integrations/riot/schemas"

describe("riotMatchListSchema", () => {
  it("accepts history as string array", () => {
    const parsed = riotMatchListSchema.parse({
      puuid: "puuid-1",
      history: ["match-1", "match-2"],
    })

    expect(parsed.history).toHaveLength(2)
  })

  it("accepts history as object array with matchId", () => {
    const parsed = riotMatchListSchema.parse({
      puuid: "puuid-1",
      history: [
        { matchId: "match-1", gameStartTimeMillis: 1234567, queueId: "competitive" },
        { matchId: "match-2" },
      ],
    })

    expect(parsed.history).toHaveLength(2)
  })
})
