import { chronological } from "@/analytics/entity-stats"
import type { MatchPerformance } from "@/types/domain"

export type MetricFormat = "number" | "percent" | "ratio" | "duration"

export type ComparisonMetric = {
  key: string
  label: string
  current: number | null
  previous: number | null
  delta: number | null
  deltaPercent: number | null
  direction: "up" | "down" | "flat"
  isPositive: boolean | null
  format: MetricFormat
}

export type Aggregate = {
  games: number
  wins: number
  losses: number
  winRate: number | null
  kda: number | null
  avgAcs: number | null
  hsPct: number | null
  avgKills: number | null
  avgDeaths: number | null
  avgAssists: number | null
  avgDurationSec: number | null
}

export type PeriodComparison = {
  available: boolean
  currentLabel: string
  previousLabel: string
  currentGames: number
  previousGames: number
  metrics: ComparisonMetric[]
}

export type EntitySide = {
  key: string
  name: string
  aggregate: Aggregate
  bestSplit: { name: string; winRate: number; games: number } | null
  worstSplit: { name: string; winRate: number; games: number } | null
}

export type EntityComparison = {
  available: boolean
  a: EntitySide | null
  b: EntitySide | null
  metrics: ComparisonMetric[]
}

export type WinsLossesComparison = {
  available: boolean
  wins: Aggregate
  losses: Aggregate
  metrics: ComparisonMetric[]
  topWinAgents: Array<{ name: string; winRate: number; games: number }>
  topLossMaps: Array<{ name: string; losses: number; games: number }>
}

export type RecentTrendLine = { label: string; recent: number | null; previous: number | null }

export type RecentTrendComparison = {
  available: boolean
  windowSize: number
  lines: RecentTrendLine[]
  metrics: ComparisonMetric[]
}

const EPS = 0.05

function avg(values: number[]): number | null {
  if (!values.length) return null
  return values.reduce((s, v) => s + v, 0) / values.length
}

function num(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** Aggregate per-match stats. Returns null metrics when there is no data. */
export function aggregate(matches: MatchPerformance[]): Aggregate {
  const games = matches.length
  if (!games) {
    return {
      games: 0,
      wins: 0,
      losses: 0,
      winRate: null,
      kda: null,
      avgAcs: null,
      hsPct: null,
      avgKills: null,
      avgDeaths: null,
      avgAssists: null,
      avgDurationSec: null,
    }
  }

  const wins = matches.filter((m) => m.outcome === "win").length
  const losses = matches.filter((m) => m.outcome === "loss").length
  const kills = matches.reduce((s, m) => s + (m.kills ?? 0), 0)
  const deaths = matches.reduce((s, m) => s + (m.deaths ?? 0), 0)
  const assists = matches.reduce((s, m) => s + (m.assists ?? 0), 0)
  // ACS / HS% may be absent — only average the matches that actually report them.
  const acsVals = matches.map((m) => num(m.acsEstimate)).filter((v): v is number => v !== null)
  const hsVals = matches.map((m) => num(m.headshotPct)).filter((v): v is number => v !== null)
  const durVals = matches.map((m) => num(m.durationSeconds)).filter((v): v is number => v !== null && v > 0)

  return {
    games,
    wins,
    losses,
    winRate: (wins / games) * 100,
    kda: (kills + assists) / Math.max(1, deaths),
    avgAcs: acsVals.length ? avg(acsVals) : null,
    hsPct: hsVals.length ? avg(hsVals) : null,
    avgKills: kills / games,
    avgDeaths: deaths / games,
    avgAssists: assists / games,
    avgDurationSec: durVals.length ? avg(durVals) : null,
  }
}

/**
 * Build a comparison metric. higherIsBetter=false flips polarity (e.g. deaths:
 * a lower value is a positive change).
 */
export function compareMetric(
  key: string,
  label: string,
  current: number | null,
  previous: number | null,
  higherIsBetter: boolean,
  format: MetricFormat,
): ComparisonMetric {
  const delta = current !== null && previous !== null ? current - previous : null
  const deltaPercent =
    delta !== null && previous !== null && Math.abs(previous) > EPS ? (delta / Math.abs(previous)) * 100 : null
  let direction: ComparisonMetric["direction"] = "flat"
  let isPositive: boolean | null = null
  if (delta !== null && Math.abs(delta) > EPS) {
    direction = delta > 0 ? "up" : "down"
    isPositive = higherIsBetter ? delta > 0 : delta < 0
  }
  return { key, label, current, previous, delta, deltaPercent, direction, isPositive, format }
}

function metricsFor(current: Aggregate, previous: Aggregate): ComparisonMetric[] {
  return [
    compareMetric("winRate", "Winrate", current.winRate, previous.winRate, true, "percent"),
    compareMetric("kda", "KDA", current.kda, previous.kda, true, "ratio"),
    compareMetric("acs", "ACS", current.avgAcs, previous.avgAcs, true, "number"),
    compareMetric("hs", "HS%", current.hsPct, previous.hsPct, true, "percent"),
    compareMetric("kills", "Kills / partida", current.avgKills, previous.avgKills, true, "ratio"),
    compareMetric("deaths", "Deaths / partida", current.avgDeaths, previous.avgDeaths, false, "ratio"),
    compareMetric("assists", "Assists / partida", current.avgAssists, previous.avgAssists, true, "ratio"),
    compareMetric(
      "duration",
      "Duración media",
      current.avgDurationSec,
      previous.avgDurationSec,
      true,
      "duration",
    ),
  ]
}

function winRateSplits(
  matches: MatchPerformance[],
  keyName: (m: MatchPerformance) => string,
  minGames = 2,
) {
  const buckets = new Map<string, { wins: number; games: number }>()
  for (const m of matches) {
    const name = keyName(m)
    if (!name) continue
    const b = buckets.get(name) ?? { wins: 0, games: 0 }
    b.games += 1
    if (m.outcome === "win") b.wins += 1
    buckets.set(name, b)
  }
  return Array.from(buckets.entries())
    .filter(([, b]) => b.games >= minGames)
    .map(([name, b]) => ({ name, winRate: (b.wins / b.games) * 100, games: b.games }))
    .sort((a, b) => b.winRate - a.winRate)
}

// ---- Act vs Act (competitive only) ----

export type ActComparison = {
  available: boolean
  aGames: number
  bGames: number
  metrics: ComparisonMetric[]
}

function isCompetitive(m: MatchPerformance): boolean {
  return (m.queueId || m.queueName || "").toLowerCase().includes("competitive")
}

export function buildActComparison(
  matches: MatchPerformance[],
  actIdA: string,
  actIdB: string,
): ActComparison {
  const ranked = matches.filter(isCompetitive)
  const a = ranked.filter((m) => m.actId === actIdA)
  const b = ranked.filter((m) => m.actId === actIdB)
  return {
    available: a.length > 0 && b.length > 0,
    aGames: a.length,
    bGames: b.length,
    // "current" = act A, "previous" = act B, so deltas read A vs B.
    metrics: metricsFor(aggregate(a), aggregate(b)),
  }
}

// ---- Period: recent N vs previous N (by count or by day window) ----

export type PeriodMode = "last5" | "last10" | "last20" | "days7" | "days30"

const PERIOD_LABELS: Record<PeriodMode, { unit: "count" | "days"; n: number }> = {
  last5: { unit: "count", n: 5 },
  last10: { unit: "count", n: 10 },
  last20: { unit: "count", n: 20 },
  days7: { unit: "days", n: 7 },
  days30: { unit: "days", n: 30 },
}

export function buildPeriodComparison(matches: MatchPerformance[], mode: PeriodMode, now: number): PeriodComparison {
  const cfg = PERIOD_LABELS[mode]
  const ordered = chronological(matches) // oldest -> newest
  let current: MatchPerformance[]
  let previous: MatchPerformance[]
  let currentLabel: string
  let previousLabel: string

  if (cfg.unit === "count") {
    const recent = ordered.slice(-cfg.n)
    const prior = ordered.slice(-cfg.n * 2, -cfg.n)
    current = recent
    previous = prior
    currentLabel = `Últimas ${cfg.n}`
    previousLabel = `${cfg.n} anteriores`
  } else {
    const dayMs = 24 * 60 * 60 * 1000
    const curStart = now - cfg.n * dayMs
    const prevStart = now - cfg.n * 2 * dayMs
    current = matches.filter((m) => new Date(m.startedAt).getTime() >= curStart)
    previous = matches.filter((m) => {
      const t = new Date(m.startedAt).getTime()
      return t >= prevStart && t < curStart
    })
    currentLabel = `Últimos ${cfg.n} días`
    previousLabel = `${cfg.n} días anteriores`
  }

  const available = current.length > 0 && previous.length > 0
  return {
    available,
    currentLabel,
    previousLabel,
    currentGames: current.length,
    previousGames: previous.length,
    metrics: metricsFor(aggregate(current), aggregate(previous)),
  }
}

function buildSide(
  matches: MatchPerformance[],
  key: string,
  name: string,
  splitKey: (m: MatchPerformance) => string,
): EntitySide {
  const splits = winRateSplits(matches, splitKey, 1)
  return {
    key,
    name,
    aggregate: aggregate(matches),
    bestSplit: splits[0] ?? null,
    worstSplit: splits.length > 1 ? splits[splits.length - 1] : null,
  }
}

export function buildAgentComparison(
  matches: MatchPerformance[],
  agentA: string,
  agentB: string,
): EntityComparison {
  const a = matches.filter((m) => m.agentName === agentA)
  const b = matches.filter((m) => m.agentName === agentB)
  if (!a.length || !b.length || agentA === agentB) {
    return { available: false, a: null, b: null, metrics: [] }
  }
  const sideA = buildSide(a, agentA, agentA, (m) => m.mapName)
  const sideB = buildSide(b, agentB, agentB, (m) => m.mapName)
  return { available: true, a: sideA, b: sideB, metrics: metricsFor(sideA.aggregate, sideB.aggregate) }
}

export function buildMapComparison(matches: MatchPerformance[], mapA: string, mapB: string): EntityComparison {
  const a = matches.filter((m) => m.mapName === mapA)
  const b = matches.filter((m) => m.mapName === mapB)
  if (!a.length || !b.length || mapA === mapB) {
    return { available: false, a: null, b: null, metrics: [] }
  }
  const sideA = buildSide(a, mapA, mapA, (m) => m.agentName)
  const sideB = buildSide(b, mapB, mapB, (m) => m.agentName)
  return { available: true, a: sideA, b: sideB, metrics: metricsFor(sideA.aggregate, sideB.aggregate) }
}

export function buildWinsLossesComparison(matches: MatchPerformance[]): WinsLossesComparison {
  const wins = matches.filter((m) => m.outcome === "win")
  const losses = matches.filter((m) => m.outcome === "loss")
  const winsAgg = aggregate(wins)
  const lossesAgg = aggregate(losses)
  // In wins vs losses, "deaths lower" is descriptive, not better/worse — use
  // higherIsBetter=true everywhere so deltas read as "wins minus losses".
  const metrics = [
    compareMetric("kda", "KDA", winsAgg.kda, lossesAgg.kda, true, "ratio"),
    compareMetric("acs", "ACS", winsAgg.avgAcs, lossesAgg.avgAcs, true, "number"),
    compareMetric("hs", "HS%", winsAgg.hsPct, lossesAgg.hsPct, true, "percent"),
    compareMetric("kills", "Kills / partida", winsAgg.avgKills, lossesAgg.avgKills, true, "ratio"),
    compareMetric("deaths", "Deaths / partida", winsAgg.avgDeaths, lossesAgg.avgDeaths, true, "ratio"),
    compareMetric("assists", "Assists / partida", winsAgg.avgAssists, lossesAgg.avgAssists, true, "ratio"),
  ]
  return {
    available: wins.length > 0 && losses.length > 0,
    wins: winsAgg,
    losses: lossesAgg,
    metrics,
    topWinAgents: winRateSplits(matches, (m) => m.agentName, 2).slice(0, 3),
    topLossMaps: Array.from(
      matches.reduce((map, m) => {
        if (!m.mapName) return map
        const b = map.get(m.mapName) ?? { losses: 0, games: 0 }
        b.games += 1
        if (m.outcome === "loss") b.losses += 1
        map.set(m.mapName, b)
        return map
      }, new Map<string, { losses: number; games: number }>()),
    )
      .map(([name, b]) => ({ name, losses: b.losses, games: b.games }))
      .filter((r) => r.losses > 0)
      .sort((a, b) => b.losses - a.losses)
      .slice(0, 3),
  }
}

export function buildRecentTrendComparison(matches: MatchPerformance[], windowSize: number): RecentTrendComparison {
  const ordered = chronological(matches)
  const recent = ordered.slice(-windowSize)
  const previous = ordered.slice(-windowSize * 2, -windowSize)
  const acs = (m: MatchPerformance | undefined) => (m ? Math.round(m.acsEstimate ?? 0) : null)
  // Overlay the two windows on a shared 1..N index for a recent-vs-previous chart.
  const lines: RecentTrendLine[] = Array.from({ length: windowSize }, (_, i) => ({
    label: `${i + 1}`,
    recent: acs(recent[i]),
    previous: acs(previous[i]),
  }))
  return {
    available: recent.length > 0 && previous.length > 0,
    windowSize,
    lines,
    metrics: metricsFor(aggregate(recent), aggregate(previous)),
  }
}

// ---- formatting (UI helper, kept here so tests can cover it) ----

export function formatMetricValue(value: number | null, format: MetricFormat): string {
  if (value === null || !Number.isFinite(value)) return "—"
  switch (format) {
    case "percent":
      return `${value.toFixed(1)}%`
    case "ratio":
      return value.toFixed(2)
    case "duration":
      return `${Math.round(value / 60)} min`
    default:
      return Math.round(value).toString()
  }
}
