import { riotAdapter } from "@/integrations/riot"
import type { Locale } from "@/i18n/locales"
import type { MatchPerformance } from "@/types/domain"
import { normalizeRiotId, type ScopeActOption } from "@/server/valorant/analytics/scope-filter"

export type ValorantAct = {
  id: string
  name: string
  localizedName?: string | null
  episodeName?: string | null
  actName?: string | null
  episodeNumber?: number | null
  actNumber?: number | null
  isActive?: boolean
  startTime?: string | null
  endTime?: string | null
}

// VAL-CONTENT-V1 act entries are loosely typed across regions/versions: some
// carry a `type` ("episode" | "act"), some only a name, some localizedNames.
type RawAct = {
  id: string
  name: string
  type?: string
  isActive?: boolean
  localizedNames?: Record<string, string> | null
  startTime?: string | null
  endTime?: string | null
}

const RIOT_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
}

function trailingNumber(name: string): number | null {
  const match = name.match(/(\d+)\s*$/)
  return match ? Number(match[1]) : null
}

function isEpisodeEntry(act: RawAct): boolean {
  if (act.type) return act.type.toLowerCase() === "episode"
  return /episode|episodio/i.test(act.name)
}

function localized(act: RawAct, locale: Locale): string | null {
  return act.localizedNames?.[RIOT_LOCALE[locale]] ?? null
}

/**
 * Walk the flat content acts array, pairing each "act" with the most recent
 * "episode" so we can build "Episode X // Act Y" labels. Tolerant to payloads
 * that omit `type` (falls back to treating every entry as a standalone act).
 */
export function buildActsFromContent(rawActs: RawAct[], locale: Locale = "es"): ValorantAct[] {
  const result: ValorantAct[] = []
  let episodeName: string | null = null
  let episodeNumber: number | null = null
  let actCounter = 0

  for (const act of rawActs) {
    if (!act?.id || !act?.name) continue

    if (isEpisodeEntry(act)) {
      episodeName = localized(act, locale) ?? act.name
      episodeNumber = trailingNumber(act.name)
      actCounter = 0
      continue
    }

    actCounter += 1
    const actNumber = trailingNumber(act.name) ?? actCounter
    result.push({
      id: act.id,
      name: act.name,
      localizedName: localized(act, locale),
      episodeName,
      actName: actNumber ? `Acto ${actNumber}` : act.name,
      episodeNumber,
      actNumber,
      isActive: Boolean(act.isActive),
      startTime: act.startTime ?? null,
      endTime: act.endTime ?? null,
    })
  }

  // No entry looked like an act (no type, odd names): treat all as standalone.
  if (result.length === 0) {
    return rawActs
      .filter((act) => act?.id && act?.name)
      .map((act) => ({
        id: act.id,
        name: act.name,
        localizedName: localized(act, locale),
        episodeName: null,
        actName: act.name,
        episodeNumber: null,
        actNumber: null,
        isActive: Boolean(act.isActive),
        startTime: act.startTime ?? null,
        endTime: act.endTime ?? null,
      }))
  }

  return result
}

export function formatActLabel(act: ValorantAct, locale: Locale): string {
  if (act.localizedName) return act.localizedName
  if (act.episodeNumber && act.actNumber) {
    const episodeWord = locale === "en" ? "Episode" : locale === "de" ? "Episode" : locale === "fr" ? "Épisode" : locale === "pt" ? "Episódio" : "Episodio"
    const actWord = locale === "en" ? "Act" : locale === "de" ? "Akt" : locale === "fr" ? "Acte" : locale === "pt" ? "Ato" : "Acto"
    return `${episodeWord} ${act.episodeNumber} // ${actWord} ${act.actNumber}`
  }
  if (act.name) return act.name
  return locale === "en" ? "Unknown act" : "Acto desconocido"
}

let cache: { expiresAt: number; locale: Locale; value: ValorantAct[] } | null = null
const TTL_MS = 12 * 60 * 60 * 1000

/** Acts from VAL-CONTENT-V1, normalized and labeled. Empty array on failure. */
export async function getValorantActs(locale: Locale = "es"): Promise<ValorantAct[]> {
  const now = Date.now()
  if (cache && cache.locale === locale && cache.expiresAt > now) {
    return cache.value
  }
  try {
    const content = await riotAdapter.getContent(RIOT_LOCALE[locale])
    const acts = buildActsFromContent((content.acts ?? []) as RawAct[], locale)
    cache = { expiresAt: now + TTL_MS, locale, value: acts }
    return acts
  } catch {
    return cache?.value ?? []
  }
}

/**
 * Resolve a match's act: prefer seasonId -> act metadata; otherwise classify by
 * date against act start/end windows; otherwise null ("Sin acto detectado").
 */
export function classifyMatchAct(
  seasonId: string | null | undefined,
  startedAt: string,
  actsById: Map<string, ValorantAct>,
  actsList?: ValorantAct[],
): ValorantAct | null {
  const sid = seasonId?.trim()
  if (sid) {
    const byId = actsById.get(sid.toLowerCase())
    if (byId) return byId
  }
  if (actsList?.length) {
    const ts = new Date(startedAt).getTime()
    if (Number.isFinite(ts)) {
      return (
        actsList.find((act) => {
          const start = act.startTime ? new Date(act.startTime).getTime() : null
          const end = act.endTime ? new Date(act.endTime).getTime() : null
          return start !== null && end !== null && ts >= start && ts <= end
        }) ?? null
      )
    }
  }
  return null
}

/** Map of act id (lowercased) -> act, for O(1) seasonId lookup during enrich. */
export async function getActsById(locale: Locale = "es"): Promise<Map<string, ValorantAct>> {
  const acts = await getValorantActs(locale)
  const map = new Map<string, ValorantAct>()
  for (const act of acts) {
    map.set(act.id.trim().toLowerCase(), act)
  }
  return map
}

/** Alias: every act Riot returns, not just the active one. */
export const getAllValorantActs = getValorantActs

export function isActCurrent(act: ValorantAct, currentDate?: number): boolean {
  if (act.isActive) return true
  if (currentDate !== undefined && act.startTime && act.endTime) {
    const start = new Date(act.startTime).getTime()
    const end = new Date(act.endTime).getTime()
    return Number.isFinite(start) && Number.isFinite(end) && currentDate >= start && currentDate <= end
  }
  return false
}

/**
 * Count synced matches per detected act, keyed by normalized id so casing /
 * formatting differences between match seasonId and content act id can't split
 * the tally. Matches with no act are ignored (see unresolvedActCount).
 */
export function countMatchesByAct(matches: MatchPerformance[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const match of matches) {
    const key = normalizeRiotId(match.actId)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

export function unresolvedActCount(matches: MatchPerformance[]): number {
  return matches.filter((m) => !normalizeRiotId(m.actId)).length
}

function recencyRank(act: ValorantAct): number {
  // Sort newest-first using episode/act numbers; undetected numbers sink last.
  const ep = act.episodeNumber ?? -1
  const ac = act.actNumber ?? -1
  return ep * 100 + ac
}

/**
 * Build selector options from ALL available acts (content) merged with synced
 * match counts. Acts with zero synced matches are kept by default so the user
 * can still pick them (the page then shows a per-act empty state).
 */
export function buildActScopeOptions({
  acts,
  matchCountsByAct,
  includeActsWithoutMatches = true,
  locale = "es",
  currentDate,
  detectedLabels,
}: {
  acts: ValorantAct[]
  matchCountsByAct: Map<string, number>
  includeActsWithoutMatches?: boolean
  locale?: Locale
  currentDate?: number
  detectedLabels?: Map<string, string>
}): ScopeActOption[] {
  const options: ScopeActOption[] = acts
    .map((act) => ({
      actId: act.id,
      label: formatActLabel(act, locale),
      isCurrent: isActCurrent(act, currentDate),
      games: matchCountsByAct.get(normalizeRiotId(act.id) ?? "") ?? 0,
    }))
    .filter((opt) => includeActsWithoutMatches || opt.games > 0)

  options.sort((a, b) => {
    const actA = acts.find((x) => x.id === a.actId)
    const actB = acts.find((x) => x.id === b.actId)
    return recencyRank(actB!) - recencyRank(actA!)
  })

  // Detected acts that are missing from content metadata (keep, don't drop).
  const knownIds = new Set(acts.map((a) => normalizeRiotId(a.id)))
  for (const [actId, games] of matchCountsByAct) {
    if (knownIds.has(actId)) continue
    options.push({ actId, label: detectedLabels?.get(actId) ?? actId, isCurrent: false, games })
  }

  return options
}

export type HistoryCoverage = {
  rawMatchlistCount: number | null
  fetchedDetailsCount: number | null
  normalizedMatchesCount: number
  oldestMatchDate: string | null
  newestMatchDate: string | null
  matchesWithRawSeasonId: number
  matchesWithNormalizedSeasonId: number
  matchesWithActId: number
  matchesMatchedToKnownAct: number
  matchesMatchedByDateFallback: number
  matchesWithoutAct: number
  uniqueSeasonIds: Array<{ seasonId: string; count: number; actLabel: string | null }>
  actCoverage: Array<{
    actId: string
    actLabel: string
    isCurrent: boolean
    syncedMatches: number
    rankedMatches: number
  }>
}

function isCompetitiveMatch(m: MatchPerformance): boolean {
  return (m.queueId || m.queueName || "").toLowerCase().includes("competitive")
}

/**
 * Pure, secret-free coverage report for the synced-history <-> act linking.
 * Safe to surface in a dev-only diagnostics card. Answers "are old acts 0
 * because unplayed or just unsynced?".
 */
export function computeHistoryCoverage({
  normalizedMatches,
  acts,
  rawMatchlistCount = null,
  fetchedDetailsCount = null,
  locale = "es",
}: {
  normalizedMatches: MatchPerformance[]
  acts: ValorantAct[]
  rawMatchlistCount?: number | null
  fetchedDetailsCount?: number | null
  locale?: Locale
}): HistoryCoverage {
  const matches = normalizedMatches
  const knownById = new Map(acts.map((a) => [normalizeRiotId(a.id), a] as const))
  const counts = countMatchesByAct(matches)

  const dates = matches.map((m) => new Date(m.startedAt).getTime()).filter((t) => Number.isFinite(t))
  const oldest = dates.length ? new Date(Math.min(...dates)).toISOString() : null
  const newest = dates.length ? new Date(Math.max(...dates)).toISOString() : null

  const seasonCounts = new Map<string, number>()
  for (const m of matches) {
    const id = normalizeRiotId(m.seasonId)
    if (id) seasonCounts.set(id, (seasonCounts.get(id) ?? 0) + 1)
  }

  // A match was matched by date fallback when it has an act but no usable
  // seasonId that maps to a known act.
  const matchesMatchedByDateFallback = matches.filter((m) => {
    const act = normalizeRiotId(m.actId)
    const season = normalizeRiotId(m.seasonId)
    return Boolean(act) && (!season || !knownById.has(season))
  }).length

  return {
    rawMatchlistCount,
    fetchedDetailsCount,
    normalizedMatchesCount: matches.length,
    oldestMatchDate: oldest,
    newestMatchDate: newest,
    matchesWithRawSeasonId: matches.filter((m) => Boolean(m.seasonId && m.seasonId.trim())).length,
    matchesWithNormalizedSeasonId: matches.filter((m) => normalizeRiotId(m.seasonId)).length,
    matchesWithActId: matches.filter((m) => normalizeRiotId(m.actId)).length,
    matchesMatchedToKnownAct: matches.filter((m) => knownById.has(normalizeRiotId(m.actId))).length,
    matchesMatchedByDateFallback,
    matchesWithoutAct: unresolvedActCount(matches),
    uniqueSeasonIds: Array.from(seasonCounts.entries())
      .map(([seasonId, count]) => ({ seasonId, count, actLabel: knownById.has(seasonId) ? formatActLabel(knownById.get(seasonId)!, locale) : null }))
      .sort((a, b) => b.count - a.count),
    actCoverage: acts
      .map((a) => {
        const id = normalizeRiotId(a.id)
        return {
          actId: a.id,
          actLabel: formatActLabel(a, locale),
          isCurrent: isActCurrent(a),
          syncedMatches: counts.get(id ?? "") ?? 0,
          rankedMatches: matches.filter((m) => normalizeRiotId(m.actId) === id && isCompetitiveMatch(m)).length,
        }
      })
      .sort((a, b) => b.syncedMatches - a.syncedMatches),
  }
}

/** Dev-only console dump of the coverage report. No-op in production. */
export function debugValorantHistoryCoverage(input: {
  normalizedMatches: MatchPerformance[]
  acts: ValorantAct[]
  rawMatchlistCount?: number
}): void {
  if (process.env.NODE_ENV === "production") return
  const c = computeHistoryCoverage(input)
  const lines = [
    "=== Valorant history coverage ===",
    `Raw matchlist entries: ${c.rawMatchlistCount ?? "?"}`,
    `Normalized matches: ${c.normalizedMatchesCount}`,
    `Oldest match date: ${c.oldestMatchDate ?? "—"}`,
    `Newest match date: ${c.newestMatchDate ?? "—"}`,
    `Matches with normalized seasonId: ${c.matchesWithNormalizedSeasonId}`,
    `Matches with actId: ${c.matchesWithActId}`,
    `Matches matched to content act by ID: ${c.matchesMatchedToKnownAct}`,
    `Matches matched by date fallback: ${c.matchesMatchedByDateFallback}`,
    `Matches without act: ${c.matchesWithoutAct}`,
    "Counts by act:",
    ...c.actCoverage.map((a) => `  - ${a.actLabel}: ${a.syncedMatches} (${a.rankedMatches} ranked)`),
  ]
  // eslint-disable-next-line no-console
  console.info(lines.join("\n"))
}
