import { aggregate } from "@/server/valorant/analytics/comparisons"
import { normalizeRiotId } from "@/server/valorant/analytics/scope-filter"
import { SOURCE_BADGE, type ExternalActSummary } from "@/server/valorant/analytics/external-act-summaries"
import type { MatchPerformance } from "@/types/domain"

export type ActProgressionRow = {
  key: string
  actLabel: string
  source: string
  badge: string
  isReal: boolean
  games: number | null
  winRate: number | null
  kda: number | null
  acs: number | null
  hsPct: number | null
  finalRank: string | null
  peakRank: string | null
  finalRankTier: number | null
  peakRankTier: number | null
  mainAgent: string | null
}

function topAgent(matches: MatchPerformance[]): string | null {
  const counts = new Map<string, number>()
  for (const m of matches) counts.set(m.agentName, (counts.get(m.agentName) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

/**
 * Combine acts with real synced matches and user-provided external/manual
 * summaries into one progression list. Real and external rows are clearly
 * tagged (badge) and never merged into a single blended number.
 */
export function buildActProgressionRows(
  matches: MatchPerformance[],
  external: ExternalActSummary[],
): ActProgressionRow[] {
  const rows: ActProgressionRow[] = []

  // Real acts: group by normalized actId.
  const byAct = new Map<string, MatchPerformance[]>()
  for (const m of matches) {
    const key = normalizeRiotId(m.actId)
    if (!key) continue
    const list = byAct.get(key) ?? []
    list.push(m)
    byAct.set(key, list)
  }
  for (const [key, list] of byAct) {
    const agg = aggregate(list)
    rows.push({
      key: `riot:${key}`,
      actLabel: list[0].actLabel || list[0].actName || "Acto",
      source: "riot",
      badge: SOURCE_BADGE.riot,
      isReal: true,
      games: agg.games,
      winRate: agg.winRate,
      kda: agg.kda,
      acs: agg.avgAcs,
      hsPct: agg.hsPct,
      finalRank: null,
      peakRank: null,
      finalRankTier: null,
      peakRankTier: null,
      mainAgent: topAgent(list),
    })
  }

  // External/manual rows.
  for (const s of external) {
    rows.push({
      key: `ext:${s.id}`,
      actLabel: s.actLabel,
      source: s.source,
      badge: SOURCE_BADGE[s.source] ?? "Manual",
      isReal: false,
      games: s.matchesPlayed ?? null,
      winRate: s.winRate ?? null,
      kda: s.kda ?? null,
      acs: s.avgCombatScore ?? null,
      hsPct: s.headshotPercent ?? null,
      finalRank: s.finalRank ?? null,
      peakRank: s.peakRank ?? null,
      finalRankTier: s.finalRankTier ?? null,
      peakRankTier: s.peakRankTier ?? null,
      mainAgent: s.mainAgent ?? null,
    })
  }

  return rows.sort((a, b) => a.actLabel.localeCompare(b.actLabel))
}

export type ActMetricDelta = {
  key: string
  label: string
  format: "percent" | "ratio" | "number"
  a: number | null
  b: number | null
  delta: number | null // b - a; null when either side has no data
  neutral: boolean // games count: more/less, not better/worse
}

export type ActRankDelta = {
  a: string | null
  b: string | null
  direction: "up" | "down" | "same" | null // requires both tiers
}

export type ActComparison = {
  a: ActProgressionRow
  b: ActProgressionRow
  metrics: ActMetricDelta[]
  finalRank: ActRankDelta
  peakRank: ActRankDelta
}

function delta(a: number | null, b: number | null): number | null {
  return a !== null && a !== undefined && b !== null && b !== undefined ? b - a : null
}

function rankDelta(aStr: string | null, bStr: string | null, aTier: number | null, bTier: number | null): ActRankDelta {
  let direction: ActRankDelta["direction"] = null
  if (aTier !== null && aTier !== undefined && bTier !== null && bTier !== undefined) {
    direction = bTier > aTier ? "up" : bTier < aTier ? "down" : "same"
  }
  return { a: aStr ?? null, b: bStr ?? null, direction }
}

/** Compare two acts (real and/or external). delta = B - A. Missing -> null. */
export function compareActProgression(a: ActProgressionRow, b: ActProgressionRow): ActComparison {
  return {
    a,
    b,
    metrics: [
      { key: "winRate", label: "Winrate", format: "percent", a: a.winRate, b: b.winRate, delta: delta(a.winRate, b.winRate), neutral: false },
      { key: "kda", label: "KDA", format: "ratio", a: a.kda, b: b.kda, delta: delta(a.kda, b.kda), neutral: false },
      { key: "acs", label: "ACS", format: "number", a: a.acs, b: b.acs, delta: delta(a.acs, b.acs), neutral: false },
      { key: "hsPct", label: "HS%", format: "percent", a: a.hsPct, b: b.hsPct, delta: delta(a.hsPct, b.hsPct), neutral: false },
      { key: "games", label: "Partidas", format: "number", a: a.games, b: b.games, delta: delta(a.games, b.games), neutral: true },
    ],
    finalRank: rankDelta(a.finalRank, b.finalRank, a.finalRankTier, b.finalRankTier),
    peakRank: rankDelta(a.peakRank, b.peakRank, a.peakRankTier, b.peakRankTier),
  }
}
