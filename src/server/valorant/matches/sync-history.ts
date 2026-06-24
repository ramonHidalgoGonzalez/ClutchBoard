import {
  classifyMatchAct,
  formatActLabel,
  getActsById,
  getAllValorantActs,
} from "@/server/valorant/content/acts"
import { normalizeRiotId } from "@/server/valorant/analytics/scope-filter"
import {
  fetchFromAdapter,
  getMatchHistoryRepository,
  type MatchHistoryRepository,
  type NormalizedMatch,
} from "@/server/valorant/matches/match-history-repository"

export type SyncMode = "recent" | "extended" | "all_available"

export type SyncResult = {
  ok: boolean
  matchlistReturned: number
  alreadySynced: number
  newMatchIds: number
  fetchedDetails: number
  failedDetails: number
  savedMatches: number
  oldestSyncedMatchDate: string | null
  newestSyncedMatchDate: string | null
  actsWithMatches: Array<{ actId: string | null; actLabel: string; count: number; rankedCount: number }>
  warnings: string[]
}

const MODE_CAP: Record<SyncMode, number> = {
  recent: 20,
  extended: 100,
  all_available: Number.POSITIVE_INFINITY,
}

/** Don't auto-sync more than once per AUTO_SYNC_COOLDOWN_MS per user. */
export const AUTO_SYNC_COOLDOWN_MS = 15 * 60 * 1000

export function shouldAutoSync(lastSyncMs: number | undefined, nowMs: number, cooldownMs = AUTO_SYNC_COOLDOWN_MS): boolean {
  if (!lastSyncMs) return true
  return nowMs - lastSyncMs >= cooldownMs
}

function isCompetitive(m: NormalizedMatch): boolean {
  return (m.queueId || m.queueName || "").toLowerCase().includes("competitive")
}

export type SyncDeps = {
  repo?: MatchHistoryRepository
  fetchNormalized?: (puuid: string) => Promise<NormalizedMatch[]>
}

/**
 * Diff the available matchlist against what's already persisted, save the new
 * matches, and report coverage. Never fabricates matches — only persists what
 * Riot returns. Caller must pass a session-derived puuid (never client input).
 */
export async function syncValorantMatchHistory(
  {
    userId,
    puuid,
    mode = "recent",
    maxNewMatches,
  }: { userId: string; puuid: string; mode?: SyncMode; maxNewMatches?: number },
  deps: SyncDeps = {},
): Promise<SyncResult> {
  const repo = deps.repo ?? getMatchHistoryRepository()
  const fetchNormalized = deps.fetchNormalized ?? ((p: string) => fetchFromAdapter(p))
  const warnings: string[] = []

  const available = await fetchNormalized(puuid)
  const existing = await repo.listSyncedMatchIds(puuid)
  const cap = Math.max(0, maxNewMatches ?? MODE_CAP[mode])

  const missing = available.filter((m) => !existing.has(m.matchId)).slice(0, cap)
  const savedMatches = missing.length ? await repo.saveMatches(userId, puuid, missing) : 0

  if (missing.length === 0 && available.length > 0) {
    warnings.push(
      "Riot no ha devuelto partidas más antiguas en el matchlist disponible. Clutchboard solo puede analizar partidas sincronizadas.",
    )
  }

  const all = await repo.getAllSyncedMatches(puuid)
  const dates = all.map((m) => new Date(m.startedAt).getTime()).filter((t) => Number.isFinite(t))

  const [actsById, actsList] = await Promise.all([getActsById(), getAllValorantActs()])
  const byAct = new Map<string | null, { actLabel: string; count: number; rankedCount: number }>()
  for (const m of all) {
    const act = classifyMatchAct(m.seasonId, m.startedAt, actsById, actsList)
    const id = act ? act.id : null
    const entry = byAct.get(id) ?? {
      actLabel: act ? formatActLabel(act, "es") : "Sin acto detectado",
      count: 0,
      rankedCount: 0,
    }
    entry.count += 1
    if (isCompetitive(m)) entry.rankedCount += 1
    byAct.set(id, entry)
  }

  return {
    ok: true,
    matchlistReturned: available.length,
    alreadySynced: existing.size,
    newMatchIds: missing.length,
    fetchedDetails: missing.length,
    failedDetails: 0,
    savedMatches,
    oldestSyncedMatchDate: dates.length ? new Date(Math.min(...dates)).toISOString() : null,
    newestSyncedMatchDate: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    actsWithMatches: Array.from(byAct.entries())
      .map(([actId, v]) => ({ actId, ...v }))
      .sort((a, b) => b.count - a.count),
    warnings: [...warnings, ...normalizeRiotIdWarnings(all)],
  }
}

function normalizeRiotIdWarnings(matches: NormalizedMatch[]): string[] {
  const withoutSeason = matches.filter((m) => !normalizeRiotId(m.seasonId)).length
  if (withoutSeason > 0) {
    return [`${withoutSeason} partidas sincronizadas sin seasonId — se clasifican por fecha o como "Sin acto detectado".`]
  }
  return []
}
