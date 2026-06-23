import type { MatchPerformance } from "@/types/domain"

export type EntitySummary = {
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
  kills: number
  deaths: number
  assists: number
  rounds: number
  killsPerRound: number
  deathsPerRound: number
  assistsPerRound: number
  kd: number
  kda: number
  avgAcs: number
  hsPct: number
  firstBloods: number
  playtimeSeconds: number
}

export type WinrateRow = {
  key: string
  name: string
  imageUrl?: string | null
  iconUrl?: string | null
  wins: number
  total: number
  winRate: number
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0)
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0
}

/** Sort matches chronologically (oldest first) for time-series charts. */
export function chronological(matches: MatchPerformance[]) {
  return [...matches].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  )
}

/** Most recent first. */
export function recentFirst(matches: MatchPerformance[]) {
  return [...matches].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
}

export function lastN(matches: MatchPerformance[], n: number) {
  return recentFirst(matches).slice(0, n)
}

export function summarizeMatches(matches: MatchPerformance[]): EntitySummary {
  const games = matches.length
  const wins = matches.filter((m) => m.outcome === "win").length
  const losses = matches.filter((m) => m.outcome === "loss").length
  const draws = matches.filter((m) => m.outcome === "draw").length

  const kills = sum(matches.map((m) => m.kills ?? 0))
  const deaths = sum(matches.map((m) => m.deaths ?? 0))
  const assists = sum(matches.map((m) => m.assists ?? 0))
  const rounds = sum(matches.map((m) => (m.roundsWon ?? 0) + (m.roundsLost ?? 0)))
  const safeRounds = Math.max(1, rounds)

  return {
    games,
    wins,
    losses,
    draws,
    winRate: games ? (wins / games) * 100 : 0,
    kills,
    deaths,
    assists,
    rounds,
    killsPerRound: kills / safeRounds,
    deathsPerRound: deaths / safeRounds,
    assistsPerRound: assists / safeRounds,
    kd: deaths ? kills / deaths : kills,
    kda: deaths ? (kills + assists) / deaths : kills + assists,
    avgAcs: average(matches.map((m) => m.acsEstimate ?? 0)),
    hsPct: average(matches.map((m) => m.headshotPct ?? 0)),
    firstBloods: sum(matches.map((m) => m.firstBloods ?? 0)),
    playtimeSeconds: sum(matches.map((m) => m.durationSeconds ?? 0)),
  }
}

/** Per-match ACS in chronological order — feeds sparklines and trend charts. */
export function acsSeries(matches: MatchPerformance[]) {
  return chronological(matches).map((m) => Math.round(m.acsEstimate ?? 0))
}

export function kdSeries(matches: MatchPerformance[]) {
  return chronological(matches).map((m) =>
    Number((((m.kills ?? 0) / Math.max(1, m.deaths ?? 0))).toFixed(2)),
  )
}

type WinrateGetter = (match: MatchPerformance) => {
  key: string
  name: string
  imageUrl?: string | null
  iconUrl?: string | null
}

/** Group winrate by an arbitrary entity (map for an agent view, agent for a map view). */
export function winrateBy(matches: MatchPerformance[], getter: WinrateGetter): WinrateRow[] {
  const buckets = new Map<string, WinrateRow>()

  for (const match of matches) {
    const { key, name, imageUrl, iconUrl } = getter(match)
    const row =
      buckets.get(key) ?? { key, name, imageUrl, iconUrl, wins: 0, total: 0, winRate: 0 }
    row.total += 1
    if (match.outcome === "win") {
      row.wins += 1
    }
    if (!row.imageUrl && imageUrl) {
      row.imageUrl = imageUrl
    }
    buckets.set(key, row)
  }

  return Array.from(buckets.values())
    .map((row) => ({ ...row, winRate: row.total ? (row.wins / row.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total || b.winRate - a.winRate)
}

export type EntityDeltas = {
  available: boolean
  winRate: number
  kd: number
  acs: number
  hsPct: number
}

/**
 * Self-relative trend: compare the most recent half of an entity's matches
 * against the older half. Real signal, no external baseline invented.
 */
export function splitDelta(matches: MatchPerformance[]): EntityDeltas {
  const ordered = chronological(matches)
  if (ordered.length < 6) {
    return { available: false, winRate: 0, kd: 0, acs: 0, hsPct: 0 }
  }

  const mid = Math.floor(ordered.length / 2)
  const older = summarizeMatches(ordered.slice(0, mid))
  const recent = summarizeMatches(ordered.slice(mid))

  return {
    available: true,
    winRate: recent.winRate - older.winRate,
    kd: recent.kd - older.kd,
    acs: recent.avgAcs - older.avgAcs,
    hsPct: recent.hsPct - older.hsPct,
  }
}

export function formatPlaytime(seconds: number) {
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

/**
 * Rough percentile of this entity's avg ACS versus the player's other matches.
 * Real, self-relative metric (no external baseline fabricated).
 */
export function acsPercentile(entityMatches: MatchPerformance[], allMatches: MatchPerformance[]) {
  if (!entityMatches.length || allMatches.length < 2) {
    return null
  }
  const entityAvg = average(entityMatches.map((m) => m.acsEstimate ?? 0))
  const below = allMatches.filter((m) => (m.acsEstimate ?? 0) <= entityAvg).length
  return Math.round((below / allMatches.length) * 100)
}
