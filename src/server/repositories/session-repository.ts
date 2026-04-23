import type { Session } from "@prisma/client"

import { getPrisma } from "@/database/prisma"

const memorySessions = new Map<string, Session>()

type CreateSessionInput = {
  id: string
  userId: string
  sessionTokenHash: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
}

export async function createSessionRecord(input: CreateSessionInput) {
  const prisma = getPrisma()

  if (!prisma) {
    const session: Session = {
      id: input.id,
      userId: input.userId,
      sessionTokenHash: input.sessionTokenHash,
      expiresAt: input.expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    memorySessions.set(input.sessionTokenHash, session)
    return session
  }

  return prisma.session.create({
    data: input,
  })
}

export async function findSessionRecord(sessionTokenHash: string) {
  const prisma = getPrisma()
  if (!prisma) {
    return memorySessions.get(sessionTokenHash) ?? null
  }

  return prisma.session.findUnique({
    where: {
      sessionTokenHash,
    },
  })
}

export async function revokeSessionRecord(sessionTokenHash: string) {
  const prisma = getPrisma()
  if (!prisma) {
    memorySessions.delete(sessionTokenHash)
    return
  }

  await prisma.session.deleteMany({
    where: {
      sessionTokenHash,
    },
  })
}
