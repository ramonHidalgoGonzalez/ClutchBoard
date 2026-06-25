import { riotAdapter } from "@/integrations/riot"
import {
  getMatchHistoryRepository,
  type MatchHistoryRepository,
  type NormalizedMatch,
} from "@/server/valorant/matches/match-history-repository"

/** Queues scanned by deep sync (official VAL-MATCH-V1 recent-matches queues). */
export const DEEP_SYNC_QUEUES = ["competitive", "unrated", "swiftplay", "spikerush", "deathmatch"]

const DEFAULT_MAX_DETAILS = 30
const HARD_MAX_DETAILS = 60

export type DeepSyncResult = {
  ok: boolean
  queuesScanned: string[]
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
  skippedExisting: number
  rateLimited: boolean
  errors: string[]
}

export type DeepSyncDeps = {
  repo?: MatchHistoryRepository
  getRecentIds?: (queue: string) => Promise<string[]>
  normalize?: (matchId: string, puuid: string) => Promise<NormalizedMatch | null>
}

function is429(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /\b429\b|rate.?limit/i.test(message)
}

function short(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 80)
}

/**
 * Experimental: scan Riot's platform-wide recent matches per queue and persist
 * the ones the user actually played. Low yield (only catches very recent
 * matches missing from the by-puuid matchlist) but never fabricates data,
 * skips already-synced ids, hard-caps detail fetches and stops on 429.
 */
export async function deepSyncRecentMatches(
  { userId, puuid, maxDetails = DEFAULT_MAX_DETAILS }: { userId: string; puuid: string; maxDetails?: number },
  deps: DeepSyncDeps = {},
): Promise<DeepSyncResult> {
  const repo = deps.repo ?? getMatchHistoryRepository()
  const getRecentIds = deps.getRecentIds ?? ((queue: string) => riotAdapter.getRecentMatchIdsByQueue(queue))
  const normalize = deps.normalize ?? ((id: string, p: string) => riotAdapter.normalizeMatchForPuuid(id, p))

  let budget = Math.min(Math.max(1, maxDetails), HARD_MAX_DETAILS)
  const existing = await repo.listSyncedMatchIds(puuid)
  const queuesScanned: string[] = []
  const errors: string[] = []
  const toSave: NormalizedMatch[] = []
  let matchIdsChecked = 0
  let detailsFetched = 0
  let playerMatchesFound = 0
  let skippedExisting = 0
  let rateLimited = false
  let stop = false

  for (const queue of DEEP_SYNC_QUEUES) {
    if (stop || budget <= 0) break

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

    for (const id of ids) {
      if (budget <= 0) break
      matchIdsChecked += 1
      if (existing.has(id)) {
        skippedExisting += 1
        continue
      }
      budget -= 1
      try {
        const match = await normalize(id, puuid)
        detailsFetched += 1
        if (match) {
          playerMatchesFound += 1
          toSave.push(match)
          existing.add(id)
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
  }

  const newMatchesSaved = toSave.length ? await repo.saveMatches(userId, puuid, toSave) : 0

  return {
    ok: true,
    queuesScanned,
    matchIdsChecked,
    detailsFetched,
    playerMatchesFound,
    newMatchesSaved,
    skippedExisting,
    rateLimited,
    errors: errors.slice(0, 5),
  }
}
