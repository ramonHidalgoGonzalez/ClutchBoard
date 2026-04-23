import type { SyncStatus } from "@prisma/client"

import { getPrisma } from "@/database/prisma"

export async function createSyncJob(userId: string, puuid: string, trigger: string) {
  const prisma = getPrisma()
  if (!prisma) {
    return {
      id: `sync-${Date.now()}`,
      userId,
      riotAccountPuuid: puuid,
      status: "success" satisfies SyncStatus,
      trigger,
      startedAt: new Date(),
      completedAt: new Date(),
      errorMessage: null,
      stats: { mode: "mock" },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return prisma.syncJob.create({
    data: {
      userId,
      riotAccountPuuid: puuid,
      trigger,
      status: "running",
      startedAt: new Date(),
    },
  })
}
