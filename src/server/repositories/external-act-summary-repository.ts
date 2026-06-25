import { randomUUID } from "node:crypto"

import { getPrisma } from "@/database/prisma"
import type { ExternalActInput, ExternalActSummary } from "@/server/valorant/analytics/external-act-summaries"

// In-memory fallback store (no DB): keyed by id, scoped logically by userId.
const memory = new Map<string, ExternalActSummary>()

function toSummary(row: {
  id: string
  userId: string
  puuid: string
  source: string
  createdAt: Date
  updatedAt: Date
  [k: string]: unknown
}): ExternalActSummary {
  const { createdAt, updatedAt, ...rest } = row
  return {
    ...(rest as unknown as ExternalActSummary),
    source: row.source as ExternalActSummary["source"],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

export async function listExternalActSummaries(userId: string): Promise<ExternalActSummary[]> {
  const prisma = getPrisma()
  if (!prisma) {
    return [...memory.values()].filter((s) => s.userId === userId).sort((a, b) => a.actLabel.localeCompare(b.actLabel))
  }
  const rows = await prisma.externalActSummary.findMany({ where: { userId }, orderBy: { actLabel: "asc" } })
  return rows.map((r) => toSummary(r))
}

export async function createExternalActSummary(
  userId: string,
  puuid: string,
  input: ExternalActInput,
): Promise<ExternalActSummary> {
  const prisma = getPrisma()
  if (!prisma) {
    const now = new Date()
    const summary: ExternalActSummary = {
      ...input,
      id: randomUUID(),
      userId,
      puuid,
      source: input.source ?? "manual",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    memory.set(summary.id, summary)
    return summary
  }
  const row = await prisma.externalActSummary.create({ data: { ...input, userId, puuid } })
  return toSummary(row)
}

export async function updateExternalActSummary(
  id: string,
  userId: string,
  input: ExternalActInput,
): Promise<ExternalActSummary | null> {
  const prisma = getPrisma()
  if (!prisma) {
    const existing = memory.get(id)
    if (!existing || existing.userId !== userId) return null
    const updated: ExternalActSummary = { ...existing, ...input, updatedAt: new Date().toISOString() }
    memory.set(id, updated)
    return updated
  }
  // updateMany scopes by userId so a user can't edit another user's row.
  const result = await prisma.externalActSummary.updateMany({ where: { id, userId }, data: { ...input } })
  if (result.count === 0) return null
  const row = await prisma.externalActSummary.findUnique({ where: { id } })
  return row ? toSummary(row) : null
}

export async function deleteExternalActSummary(id: string, userId: string): Promise<boolean> {
  const prisma = getPrisma()
  if (!prisma) {
    const existing = memory.get(id)
    if (!existing || existing.userId !== userId) return false
    memory.delete(id)
    return true
  }
  const result = await prisma.externalActSummary.deleteMany({ where: { id, userId } })
  return result.count > 0
}

/** Create or update by (userId, actLabel, sourceName) so imports don't duplicate. */
export async function upsertExternalActSummary(
  userId: string,
  puuid: string,
  input: ExternalActInput,
): Promise<ExternalActSummary> {
  const prisma = getPrisma()
  const sourceName = input.sourceName ?? null

  if (!prisma) {
    const existing = [...memory.values()].find(
      (s) => s.userId === userId && s.actLabel === input.actLabel && (s.sourceName ?? null) === sourceName,
    )
    if (existing) return (await updateExternalActSummary(existing.id, userId, input))!
    return createExternalActSummary(userId, puuid, input)
  }

  const existing = await prisma.externalActSummary.findFirst({ where: { userId, actLabel: input.actLabel, sourceName } })
  if (existing) {
    const row = await prisma.externalActSummary.update({ where: { id: existing.id }, data: { ...input } })
    return toSummary(row)
  }
  const row = await prisma.externalActSummary.create({ data: { ...input, userId, puuid } })
  return toSummary(row)
}
