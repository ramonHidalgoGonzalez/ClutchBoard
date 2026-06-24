import { riotAdapter } from "@/integrations/riot"
import type { MatchPerformance } from "@/types/domain"
import { recentFirst } from "@/analytics/entity-stats"
import { getPrisma } from "@/database/prisma"
import { PrismaMatchHistoryRepository } from "@/server/valorant/matches/db-match-history-repository"

export type NormalizedMatch = MatchPerformance

export type MatchPageParams = { page?: number; pageSize?: number }
export type PaginatedMatches = {
  matches: NormalizedMatch[]
  total: number
  page: number
  pageSize: number
}

/** Current normalization shape. Bump when persisted matches need re-normalizing. */
export const MATCH_NORMALIZATION_VERSION = 2

export interface MatchHistoryRepository {
  listSyncedMatchIds(puuid: string): Promise<Set<string>>
  getAllSyncedMatches(puuid: string): Promise<NormalizedMatch[]>
  getMatchesPage(puuid: string, params: MatchPageParams): Promise<PaginatedMatches>
  saveMatches(userId: string, puuid: string, matches: NormalizedMatch[]): Promise<number>
}

export function paginate(matches: NormalizedMatch[], { page = 1, pageSize = 20 }: MatchPageParams): PaginatedMatches {
  const ordered = recentFirst(matches)
  const start = Math.max(0, (page - 1) * pageSize)
  return { matches: ordered.slice(start, start + pageSize), total: ordered.length, page, pageSize }
}

/**
 * Process-memory repository used when there is no database. Persists for the
 * lifetime of the server process; on cold start it seeds from whatever the
 * adapter returns (so mock mode and the no-DB path keep working).
 */
export class InMemoryMatchHistoryRepository implements MatchHistoryRepository {
  private store = new Map<string, Map<string, NormalizedMatch>>()

  private bucket(puuid: string): Map<string, NormalizedMatch> {
    const key = puuid || "__mock__"
    let b = this.store.get(key)
    if (!b) {
      b = new Map()
      this.store.set(key, b)
    }
    return b
  }

  async listSyncedMatchIds(puuid: string): Promise<Set<string>> {
    return new Set(this.bucket(puuid).keys())
  }

  async getAllSyncedMatches(puuid: string): Promise<NormalizedMatch[]> {
    const bucket = this.bucket(puuid)
    if (bucket.size === 0) {
      // Nothing persisted yet — fall back to a live fetch so analytics isn't empty.
      const live = await fetchFromAdapter(puuid)
      return recentFirst(live)
    }
    return recentFirst([...bucket.values()])
  }

  async getMatchesPage(puuid: string, params: MatchPageParams): Promise<PaginatedMatches> {
    return paginate(await this.getAllSyncedMatches(puuid), params)
  }

  async saveMatches(_userId: string, puuid: string, matches: NormalizedMatch[]): Promise<number> {
    const bucket = this.bucket(puuid)
    let saved = 0
    for (const m of matches) {
      if (!bucket.has(m.matchId)) saved += 1
      bucket.set(m.matchId, m)
    }
    return saved
  }
}

export async function fetchFromAdapter(puuid?: string): Promise<NormalizedMatch[]> {
  // Mock adapter ignores puuid; real adapter requires it.
  return puuid ? riotAdapter.getNormalizedMatches(puuid) : riotAdapter.getNormalizedMatches()
}

let inMemorySingleton: InMemoryMatchHistoryRepository | null = null

export function getMatchHistoryRepository(): MatchHistoryRepository {
  if (getPrisma()) {
    return new PrismaMatchHistoryRepository()
  }
  inMemorySingleton ??= new InMemoryMatchHistoryRepository()
  return inMemorySingleton
}
