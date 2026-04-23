import { z } from "zod"

export const riotAccountSchema = z.object({
  puuid: z.string(),
  gameName: z.string().nullable().optional(),
  tagLine: z.string().nullable().optional(),
})

export const riotMatchListSchema = z.object({
  puuid: z.string(),
  history: z.array(z.string()),
})

export const riotMatchSchema = z.object({
  matchInfo: z.object({
    matchId: z.string(),
    mapId: z.string(),
    gameStartMillis: z.number(),
    gameLengthMillis: z.number(),
    queueId: z.string(),
    gameMode: z.string(),
    seasonId: z.string().nullable().optional(),
    region: z.string(),
    provisioningFlowId: z.string().nullable().optional(),
    isCompleted: z.boolean().nullable().optional(),
  }),
  players: z.array(
    z.object({
      puuid: z.string(),
      teamId: z.string(),
      characterId: z.string(),
      characterName: z.string(),
      stats: z.object({
        score: z.number().optional(),
        roundsPlayed: z.number().optional(),
        kills: z.number(),
        deaths: z.number(),
        assists: z.number(),
      }),
      economy: z.object({ spent: z.number().optional() }).nullable().optional(),
      behaviorFactors: z
        .object({
          afkRounds: z.number().optional(),
          friendlyFireIncoming: z.number().optional(),
          damageParticipationOutgoing: z.number().optional(),
        })
        .nullable()
        .optional(),
      competitiveTier: z.number().nullable().optional(),
    }),
  ),
  teams: z.array(
    z.object({
      teamId: z.string(),
      won: z.boolean(),
      roundsWon: z.number(),
      roundsLost: z.number(),
    }),
  ),
  roundResults: z
    .array(
      z.object({
        roundNum: z.number(),
        winningTeam: z.string(),
        playerStats: z
          .array(
            z.object({
              puuid: z.string(),
              kills: z.array(z.object({ timeSinceGameStartMillis: z.number() })).optional(),
              damage: z
                .array(
                  z.object({
                    damage: z.number(),
                    legshots: z.number(),
                    bodyshots: z.number(),
                    headshots: z.number(),
                  }),
                )
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
})
