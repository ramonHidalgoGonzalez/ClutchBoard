import type { User } from "@prisma/client"

import { getPrisma } from "@/database/prisma"

const memoryUsers = new Map<string, User>()

export async function findOrCreateUserFromRiotAccount(input: {
  puuid: string
  gameName: string
  tagLine: string
}) {
  const prisma = getPrisma()
  const displayName = `${input.gameName}#${input.tagLine}`

  if (!prisma) {
    let user = Array.from(memoryUsers.values()).find((candidate) => candidate.displayName === displayName)
    if (!user) {
      user = {
        id: `user-${input.puuid}`,
        email: null,
        displayName,
        avatarUrl: null,
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      memoryUsers.set(user.id, user)
    }

    return {
      user,
      riotAccount: {
        id: `riot-${input.puuid}`,
        userId: user.id,
        puuid: input.puuid,
        gameName: input.gameName,
        tagLine: input.tagLine,
        region: "europe",
        platform: "eu",
        scopes: ["openid", "offline_access"],
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        lastSyncedAt: new Date(),
        officialProfile: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
  }

  const riotAccount = await prisma.riotAccount.upsert({
    where: { puuid: input.puuid },
    update: {
      gameName: input.gameName,
      tagLine: input.tagLine,
      lastSyncedAt: new Date(),
    },
    create: {
      puuid: input.puuid,
      gameName: input.gameName,
      tagLine: input.tagLine,
      region: "europe",
      platform: "eu",
      scopes: ["openid", "offline_access"],
      user: {
        create: {
          displayName,
        },
      },
    },
    include: {
      user: true,
    },
  })

  return {
    user: riotAccount.user,
    riotAccount,
  }
}
