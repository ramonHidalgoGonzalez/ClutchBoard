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
      mainAgent: s.mainAgent ?? null,
    })
  }

  return rows.sort((a, b) => a.actLabel.localeCompare(b.actLabel))
}
