import {
  acsPercentile,
  chronological,
  formatPlaytime,
  lastN,
  splitDelta,
  summarizeMatches,
  winrateBy,
} from "@/analytics/entity-stats"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import type { MatchPerformance } from "@/types/domain"

export type CompareRow = {
  key: string
  label: string
  value: number | null
  avg: number | null
  delta: number | null
  isPositive: boolean | null
  format: "ratio" | "percent" | "int"
}

export type MapSplit = {
  name: string
  banner: string | null
  winRate: number
  kd: number
  avgAcs: number
  games: number
} | null

export type StrengthRow = { label: string; percentile: number }

export type AbilityRow = { label: string; perRound: number; impact: "Alto" | "Medio" | "Bajo" }

export type AgentProfile = {
  games: number
  wins: number
  losses: number
  draws: number
  winRate: number
  kd: number
  kda: number
  avgAcs: number
  hsPct: number
  killsPerRound: number
  deathsPerRound: number
  assistsPerRound: number
  firstBloodsPerRound: number
  firstBloods: number
  playtime: string
  sharePct: number
  grade: { letter: string; label: string }
  deltas: { winRate: number; kd: number; acs: number; hs: number; games: number; available: boolean }
  roundsWon: number
  roundsLost: number
  winrateEvolution: Array<{ label: string; winRate: number }>
  comparison: CompareRow[]
  percentile: number | null
  bestMap: MapSplit
  worstMap: MapSplit
  recent: Array<MatchPerformance & { mvp: boolean }>
  strengths: StrengthRow[]
  abilities: AbilityRow[]
}

function kdOf(m: ReturnType<typeof summarizeMatches>) {
  return m.kd
}

function percentileOf(value: number, all: number[]) {
  if (!all.length) return 50
  const below = all.filter((v) => v <= value).length
  return Math.round((below / all.length) * 100)
}

function grade(winRate: number, kda: number, avgAcs: number) {
  const score = Math.max(
    0,
    Math.min(100, winRate * 0.4 + Math.min(kda / 2, 1) * 30 + Math.min(avgAcs / 300, 1) * 30),
  )
  if (score >= 78) return { letter: "S", label: "Excelente" }
  if (score >= 64) return { letter: "A", label: "Muy bueno" }
  if (score >= 50) return { letter: "B", label: "Bueno" }
  if (score >= 36) return { letter: "C", label: "Regular" }
  return { letter: "D", label: "A mejorar" }
}

const ABILITY_LABELS: Record<string, string> = {
  grenadeCasts: "Habilidad (C)",
  ability1Casts: "Habilidad (Q)",
  ability2Casts: "Habilidad (E)",
  ultimateCasts: "Definitiva (X)",
}

export function buildAgentProfile(
  agentMatches: MatchPerformance[],
  allMatches: MatchPerformance[],
  totalGames: number,
): AgentProfile {
  const s = summarizeMatches(agentMatches)
  const overall = summarizeMatches(allMatches)
  const rounds = Math.max(1, s.rounds)
  const firstBloodsPerRound = s.firstBloods / rounds
  const overallRounds = Math.max(1, overall.rounds)

  const ordered = chronological(agentMatches)
  let runningWins = 0
  const winrateEvolution = ordered.map((m, i) => {
    if (m.outcome === "win") runningWins += 1
    return { label: `${i + 1}`, winRate: Math.round((runningWins / (i + 1)) * 100) }
  })

  const overallFbPerRound = overall.firstBloods / overallRounds
  const comparison: CompareRow[] = [
    cmp("kd", "K/D", s.kd, overall.kd, "ratio"),
    cmp("acs", "ACS", s.avgAcs, overall.avgAcs, "int"),
    cmp("hs", "HS%", s.hsPct, overall.hsPct, "percent"),
    cmp("kills", "Kills / R", s.killsPerRound, overall.killsPerRound, "ratio"),
    cmp("fb", "First Bloods / R", firstBloodsPerRound, overallFbPerRound, "ratio"),
  ]

  const mapRows = winrateBy(agentMatches, (m) => ({
    key: m.mapId || m.mapName,
    name: m.mapName,
    imageUrl: m.mapImageUrl,
    iconUrl: m.mapIconUrl,
  }))
  const mapSplit = (name: string | undefined): MapSplit => {
    if (!name) return null
    const ms = agentMatches.filter((m) => m.mapName === name)
    const sum = summarizeMatches(ms)
    return {
      name,
      banner: getMapAssets(name).banner ?? getMapAssets(name).card,
      winRate: sum.winRate,
      kd: sum.kd,
      avgAcs: sum.avgAcs,
      games: sum.games,
    }
  }

  const allAcs = allMatches.map((m) => m.acsEstimate ?? 0)
  const allHs = allMatches.map((m) => m.headshotPct ?? 0)
  const allKda = allMatches.map((m) => ((m.kills ?? 0) + (m.assists ?? 0)) / Math.max(1, m.deaths ?? 0))
  const allFb = allMatches.map((m) => (m.firstBloods ?? 0) / Math.max(1, (m.roundsWon ?? 0) + (m.roundsLost ?? 0)))
  const strengths: StrengthRow[] = [
    { label: "ACS", percentile: percentileOf(s.avgAcs, allAcs) },
    { label: "Headshots", percentile: percentileOf(s.hsPct, allHs) },
    { label: "Primera sangre", percentile: percentileOf(firstBloodsPerRound, allFb) },
    { label: "KDA", percentile: percentileOf(s.kda, allKda) },
    { label: "Winrate", percentile: Math.round(s.winRate) },
  ]

  // Abilities: sum casts across matches, normalize per round.
  const castTotals = new Map<string, number>()
  for (const m of agentMatches) {
    const casts = m.abilityCasts ?? {}
    for (const [k, v] of Object.entries(casts)) {
      castTotals.set(k, (castTotals.get(k) ?? 0) + (Number.isFinite(v) ? v : 0))
    }
  }
  const abilities: AbilityRow[] = Array.from(castTotals.entries())
    .map(([key, total]) => {
      const perRound = total / rounds
      const impact: AbilityRow["impact"] = perRound >= 0.3 ? "Alto" : perRound >= 0.15 ? "Medio" : "Bajo"
      return { label: ABILITY_LABELS[key] ?? key, perRound, impact, order: ORDER[key] ?? 9 }
    })
    .sort((a, b) => a.order - b.order)
    .map(({ label, perRound, impact }) => ({ label, perRound, impact }))

  const delta = splitDelta(agentMatches)
  const recent = lastN(agentMatches, 5).map((m) => ({
    ...m,
    mvp: m.outcome === "win" && (m.acsEstimate ?? 0) >= Math.max(230, s.avgAcs * 1.05),
  }))

  return {
    games: s.games,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    winRate: s.winRate,
    kd: kdOf(s),
    kda: s.kda,
    avgAcs: s.avgAcs,
    hsPct: s.hsPct,
    killsPerRound: s.killsPerRound,
    deathsPerRound: s.deathsPerRound,
    assistsPerRound: s.assistsPerRound,
    firstBloodsPerRound,
    firstBloods: s.firstBloods,
    playtime: formatPlaytime(s.playtimeSeconds),
    sharePct: totalGames ? (s.games / totalGames) * 100 : 0,
    grade: grade(s.winRate, s.kda, s.avgAcs),
    deltas: {
      available: delta.available,
      winRate: delta.winRate,
      kd: delta.kd,
      acs: delta.acs,
      hs: delta.hsPct,
      games: s.games,
    },
    roundsWon: agentMatches.reduce((sum, m) => sum + (m.roundsWon ?? 0), 0),
    roundsLost: agentMatches.reduce((sum, m) => sum + (m.roundsLost ?? 0), 0),
    winrateEvolution,
    comparison,
    percentile: acsPercentile(agentMatches, allMatches),
    bestMap: mapSplit(mapRows[0]?.name),
    worstMap: mapSplit(mapRows.length > 1 ? mapRows[mapRows.length - 1]?.name : undefined),
    recent,
    strengths,
    abilities,
  }
}

const ORDER: Record<string, number> = { grenadeCasts: 0, ability1Casts: 1, ability2Casts: 2, ultimateCasts: 3 }

function cmp(key: string, label: string, value: number | null, avg: number | null, format: CompareRow["format"]): CompareRow {
  const delta = value !== null && avg !== null ? value - avg : null
  return { key, label, value, avg, delta, isPositive: delta === null ? null : delta >= 0, format }
}
