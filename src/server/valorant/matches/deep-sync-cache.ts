/**
 * Lightweight process-memory cache of match ids already checked and found NOT
 * to be the user's, so repeated deep syncs don't re-download the same global
 * matches. 24h TTL. Resets on deploy/cold start (acceptable; a DB-backed
 * version can replace this later without changing callers).
 */
const TTL_MS = 24 * 60 * 60 * 1000
const checked = new Map<string, number>()

export interface DeepSyncCheckedCache {
  has(matchId: string): boolean
  add(matchId: string): void
}

export const deepSyncCheckedCache: DeepSyncCheckedCache = {
  has(matchId) {
    const expiry = checked.get(matchId)
    if (!expiry) return false
    if (expiry < Date.now()) {
      checked.delete(matchId)
      return false
    }
    return true
  },
  add(matchId) {
    checked.set(matchId, Date.now() + TTL_MS)
  },
}
