import { PrismaClient } from "@prisma/client"

import { env } from "@/lib/env"

declare global {
  var __prisma__: PrismaClient | undefined
}

let prisma: PrismaClient | null = null

export function getPrisma() {
  if (!env.databaseUrl) {
    return null
  }

  if (prisma) {
    return prisma
  }

  prisma =
    global.__prisma__ ??
    new PrismaClient({
      log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
    })

  if (!global.__prisma__) {
    global.__prisma__ = prisma
  }

  return prisma
}
