import { riotAdapter } from "@/integrations/riot"
import type { Locale } from "@/i18n/locales"

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
