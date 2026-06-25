import { riotAdapter } from "@/integrations/riot"
import {
  getMatchHistoryRepository,
  type MatchHistoryRepository,
  type NormalizedMatch,
} from "@/server/valorant/matches/match-history-repository"
import { deepSyncCheckedCache, type DeepSyncCheckedCache } from "@/server/valorant/matches/deep-sync-cache"

/** Queues scanned by deep sync (official VAL-MATCH-V1 recent-matches queues). */
export const DEEP_SYNC_QUEUES = ["competitive", "unrated", "swiftplay", "spikerush", "deathmatch"]
export const DEFAULT_DEEP_SYNC_QUEUES = ["competitive", "unrated", "swiftplay"]

const DEFAULT_MAX_PER_QUEUE = 20
const HARD_MAX_PER_QUEUE = 30
const DEFAULT_MAX_TOTAL = 80
const HARD_MAX_TOTAL = 120

export type DeepSyncQueueStat = {
  queue: string
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
}

export type DeepSyncResult = {
  ok: boolean
  requestedQueues: string[]
  queuesScanned: string[]
  perQueue: DeepSyncQueueStat[]
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
  skippedExisting: number
  rateLimited: boolean
  reachedTotalLimit: boolean
  errors: string[]
}

export type DeepSyncOptions = {
  userId: string
  puuid: string
  queues?: string[]
  maxDetailsPerQueue?: number
  maxTotalDetails?: number
}

export type DeepSyncDeps = {
  repo?: MatchHistoryRepository
  getRecentIds?: (queue: string) => Promise<string[]>
  normalize?: (matchId: string, puuid: string) => Promise<NormalizedMatch | null>
  checkedCache?: DeepSyncCheckedCache
}

function is429(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /\b429\b|rate.?limit/i.test(message)
}

function short(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 80)
}

function clamp(value: number | undefined, fallback: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback
  return Math.min(value, max)
}

/**
 * Experimental, manual scan of Riot's platform-wide recent matches per queue,
 * persisting the ones the user actually played. Budget is split PER QUEUE (so
 * competitive can't eat the whole run) and capped globally. Skips already-synced
 * and already-checked-non-player ids, stops on 429, never fabricates data.
 */
export async function deepSyncRecentMatches(
  { userId, puuid, queues, maxDetailsPerQueue, maxTotalDetails }: DeepSyncOptions,
  deps: DeepSyncDeps = {},
): Promise<DeepSyncResult> {
  const repo = deps.repo ?? getMatchHistoryRepository()
  const getRecentIds = deps.getRecentIds ?? ((queue: string) => riotAdapter.getRecentMatchIdsByQueue(queue))
  const normalize = deps.normalize ?? ((id: string, p: string) => riotAdapter.normalizeMatchForPuuid(id, p))
  const checkedCache = deps.checkedCache ?? deepSyncCheckedCache

  const requested = (queues?.length ? queues : DEFAULT_DEEP_SYNC_QUEUES).filter((q) => DEEP_SYNC_QUEUES.includes(q))
  const perQueueCap = clamp(maxDetailsPerQueue, DEFAULT_MAX_PER_QUEUE, HARD_MAX_PER_QUEUE)
  const totalCap = clamp(maxTotalDetails, DEFAULT_MAX_TOTAL, HARD_MAX_TOTAL)

  const existing = await repo.listSyncedMatchIds(puuid)
  const queuesScanned: string[] = []
  const perQueue: DeepSyncQueueStat[] = []
  const errors: string[] = []
  const toSave: NormalizedMatch[] = []
  let totalFetched = 0
  let skippedExisting = 0
  let rateLimited = false
  let reachedTotalLimit = false
  let stop = false

  for (const queue of requested) {
    if (stop) break
    if (totalFetched >= totalCap) {
      reachedTotalLimit = true
      break
    }

    let ids: string[]
    try {
      ids = await getRecentIds(queue)
    } catch (error) {
      if (is429(error)) {
        rateLimited = true
        break
      }
      errors.push(`${queue}: ${short(error)}`)
      continue
    }
    queuesScanned.push(queue)

    const stat: DeepSyncQueueStat = { queue, matchIdsChecked: 0, detailsFetched: 0, playerMatchesFound: 0, newMatchesSaved: 0 }
    let queueBudget = Math.min(perQueueCap, totalCap - totalFetched)

    for (const id of ids) {
      if (queueBudget <= 0) break
      stat.matchIdsChecked += 1
      if (existing.has(id)) {
        skippedExisting += 1
        continue
      }
      if (checkedCache.has(id)) {
        // Known non-player from a previous run — don't re-download.
        skippedExisting += 1
        continue
      }
      queueBudget -= 1
      totalFetched += 1
      try {
        const match = await normalize(id, puuid)
        stat.detailsFetched += 1
        if (match) {
          stat.playerMatchesFound += 1
          stat.newMatchesSaved += 1
          toSave.push(match)
          existing.add(id)
        } else {
          checkedCache.add(id)
        }
      } catch (error) {
        if (is429(error)) {
          rateLimited = true
          stop = true
          break
        }
        errors.push(short(error))
      }
    }

    perQueue.push(stat)
  }

  const newMatchesSaved = toSave.length ? await repo.saveMatches(userId, puuid, toSave) : 0

  return {
    ok: true,
    requestedQueues: requested,
    queuesScanned,
    perQueue,
    matchIdsChecked: perQueue.reduce((s, q) => s + q.matchIdsChecked, 0),
    detailsFetched: perQueue.reduce((s, q) => s + q.detailsFetched, 0),
    playerMatchesFound: perQueue.reduce((s, q) => s + q.playerMatchesFound, 0),
    newMatchesSaved,
    skippedExisting,
    rateLimited,
    reachedTotalLimit,
    errors: errors.slice(0, 5),
  }
}
