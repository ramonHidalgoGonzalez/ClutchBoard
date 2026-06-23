import { recentFirst } from "@/analytics/entity-stats"
import type { Locale } from "@/i18n/locales"
import type { MatchPerformance } from "@/types/domain"

export type LastCount = 10 | 20 | 50 | 100

export type AnalyticsScope =
  | { type: "all" }
  | { type: "current_act" }
  | { type: "previous_acts" }
  | { type: "act"; actId: string }
  | { type: "last_matches"; count: LastCount }

export type ScopeActOption = { actId: string; label: string; isCurrent: boolean; games: number }

const LAST_COUNTS: LastCount[] = [10, 20, 50, 100]

export function resolveScopeFromSearchParams(sp: Record<string, string | string[] | undefined>): AnalyticsScope {
  const get = (k: string) => {
    const v = sp[k]
    return Array.isArray(v) ? v[0] : v
  }
  const scope = get("scope")
  if (scope === "all") return { type: "all" }
  if (scope === "current_act") return { type: "current_act" }
  if (scope === "previous_acts") return { type: "previous_acts" }
  if (scope === "act") {
    const actId = get("actId")
    if (actId) return { type: "act", actId }
  }
  if (scope === "last_matches") {
    const count = Number(get("count")) as LastCount
    if (LAST_COUNTS.includes(count)) return { type: "last_matches", count }
  }
  return { type: "all" }
}

/** URL query params for a scope, to keep it shareable in the address bar. */
export function serializeScope(scope: AnalyticsScope): Record<string, string> {
  switch (scope.type) {
    case "act":
      return { scope: "act", actId: scope.actId }
    case "last_matches":
      return { scope: "last_matches", count: String(scope.count) }
    default:
      return { scope: scope.type }
  }
}

function currentActId(matches: MatchPerformance[]): string | null {
  const flagged = matches.find((m) => m.isCurrentAct && m.actId)
  if (flagged?.actId) return flagged.actId
  // Fallback: the act of the most recent match counts as "current".
  return recentFirst(matches).find((m) => m.actId)?.actId ?? null
}

export function filterMatchesByScope(matches: MatchPerformance[], scope: AnalyticsScope): MatchPerformance[] {
  switch (scope.type) {
    case "all":
      return matches
    case "current_act": {
      const cur = currentActId(matches)
      return cur ? matches.filter((m) => m.actId === cur) : matches
    }
    case "previous_acts": {
      const cur = currentActId(matches)
      return cur ? matches.filter((m) => m.actId && m.actId !== cur) : []
    }
    case "act":
      return matches.filter((m) => m.actId === scope.actId)
    case "last_matches":
      return recentFirst(matches).slice(0, scope.count)
    default:
      return matches
  }
}

export function groupMatchesByAct(matches: MatchPerformance[]): Map<string, MatchPerformance[]> {
  const groups = new Map<string, MatchPerformance[]>()
  for (const m of matches) {
    if (!m.actId) continue
    const list = groups.get(m.actId) ?? []
    list.push(m)
    groups.set(m.actId, list)
  }
  return groups
}

/** Acts present in the synced matches, most recent first. */
export function getAvailableActScopes(matches: MatchPerformance[]): ScopeActOption[] {
  const cur = currentActId(matches)
  const groups = groupMatchesByAct(matches)
  const ordered = recentFirst(matches)
  const seen = new Set<string>()
  const result: ScopeActOption[] = []
  for (const m of ordered) {
    if (!m.actId || seen.has(m.actId)) continue
    seen.add(m.actId)
    result.push({
      actId: m.actId,
      label: m.actName || "Sin acto detectado",
      isCurrent: m.actId === cur,
      games: groups.get(m.actId)?.length ?? 0,
    })
  }
  return result
}

const STATIC_LABELS: Record<Locale, Record<string, string>> = {
  es: { all: "Todas las partidas sincronizadas", current_act: "Acto actual", previous_acts: "Actos anteriores", last: "Últimas {n}" },
  en: { all: "All synced matches", current_act: "Current act", previous_acts: "Previous acts", last: "Last {n}" },
  pt: { all: "Todas as partidas sincronizadas", current_act: "Ato atual", previous_acts: "Atos anteriores", last: "Últimas {n}" },
  fr: { all: "Toutes les parties synchronisées", current_act: "Acte actuel", previous_acts: "Actes précédents", last: "{n} dernières" },
  de: { all: "Alle synchronisierten Spiele", current_act: "Aktueller Akt", previous_acts: "Vorherige Akte", last: "Letzte {n}" },
}

export function getScopeLabel(scope: AnalyticsScope, locale: Locale, acts: ScopeActOption[]): string {
  const L = STATIC_LABELS[locale] ?? STATIC_LABELS.es
  switch (scope.type) {
    case "all":
      return L.all
    case "current_act":
      return L.current_act
    case "previous_acts":
      return L.previous_acts
    case "last_matches":
      return L.last.replace("{n}", String(scope.count))
    case "act":
      return acts.find((a) => a.actId === scope.actId)?.label ?? L.all
    default:
      return L.all
  }
}
