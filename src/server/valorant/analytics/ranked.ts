import { chronological, recentFirst, summarizeMatches, winrateBy } from "@/analytics/entity-stats"
import { compareMetric, type ComparisonMetric } from "@/server/valorant/analytics/comparisons"
import { tierName } from "@/lib/valorant-ranks"
import type { MatchPerformance } from "@/types/domain"

export type RankedOverview = {
  currentTierId: number | null
  currentTierName: string | null
  peakTierId: number | null
  peakTierName: string | null
  rr: number | null
  rrAvailable: boolean
  rankedMatches: number
  wins: number
  losses: number
  draws: number
  winrate: number | null
  averageKd: number | null
  averageKda: number | null
  averageAcs: number | null
  averageHs: number | null
  lastRankedDate: string | null
}

export type RankedProgressionPoint = { label: string; date: string; index: number; tierId: number; tierName: string }
export type RankedAgentStats = { name: string; games: number; winRate: number; kd: number; acs: number }
export type RankedMapStats = { name: string; games: number; winRate: number; kd: number; acs: number }
export type RankedStreak = {
  results: Array<"W" | "L" | "D">
  current: { type: "win" | "loss" | "draw" | "none"; count: number }
  bestWin: number
  worstLoss: number
}
export type RankDistributionItem = { tierId: number; tierName: string; games: number; percent: number }
export type RankedInsight = { text: string }
export type NextObjective = { available: boolean; targetTierName: string | null; message: string }

export function isCompetitive(m: MatchPerformance): boolean {
  return (m.queueName ?? "").toLowerCase() === "competitive" || (m.queueId ?? "").toLowerCase() === "competitive"
}

export function competitiveMatches(matches: MatchPerformance[]): MatchPerformance[] {
  return matches.filter(isCompetitive)
}

function tiered(matches: MatchPerformance[]) {
  return matches.filter((m) => typeof m.competitiveTier === "number" && (m.competitiveTier ?? 0) >= 3)
}

function kdOf(matches: MatchPerformance[]) {
  const k = matches.reduce((s, m) => s + (m.kills ?? 0), 0)
  const d = matches.reduce((s, m) => s + (m.deaths ?? 0), 0)
  return d ? k / d : k
}

export function buildRankedOverview(matches: MatchPerformance[]): RankedOverview {
  const ranked = competitiveMatches(matches)
  const s = summarizeMatches(ranked)
  const withTier = chronological(tiered(ranked))
  const current = withTier.at(-1)?.competitiveTier ?? null
  const peak = withTier.length ? Math.max(...withTier.map((m) => m.competitiveTier ?? 0)) : null

  return {
    currentTierId: current,
    currentTierName: tierName(current),
    peakTierId: peak,
    peakTierName: tierName(peak),
    rr: null,
    rrAvailable: false,
    rankedMatches: ranked.length,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    winrate: ranked.length ? s.winRate : null,
    averageKd: ranked.length ? kdOf(ranked) : null,
    averageKda: ranked.length ? s.kda : null,
    averageAcs: ranked.length ? s.avgAcs : null,
    averageHs: ranked.length ? s.hsPct : null,
    lastRankedDate: recentFirst(ranked)[0]?.startedAt ?? null,
  }
}

export function buildRankProgression(matches: MatchPerformance[]): RankedProgressionPoint[] {
  return chronological(tiered(competitiveMatches(matches))).map((m, index) => ({
    label: new Date(m.startedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    date: m.startedAt,
    index: index + 1,
    tierId: m.competitiveTier ?? 0,
    tierName: tierName(m.competitiveTier) ?? "—",
  }))
}

function entityStats(
  matches: MatchPerformance[],
  getter: (m: MatchPerformance) => string,
): Array<{ name: string; games: number; winRate: number; kd: number; acs: number }> {
  const rows = winrateBy(matches, (m) => ({ key: getter(m), name: getter(m) }))
  return rows
    .map((r) => {
      const subset = matches.filter((m) => getter(m) === r.name)
      const s = summarizeMatches(subset)
      return { name: r.name, games: r.total, winRate: r.winRate, kd: kdOf(subset), acs: s.avgAcs }
    })
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
}

export function buildRankedAgentStats(matches: MatchPerformance[]): RankedAgentStats[] {
  return entityStats(competitiveMatches(matches), (m) => m.agentName)
}

export function buildRankedMapStats(matches: MatchPerformance[]): RankedMapStats[] {
  return entityStats(competitiveMatches(matches), (m) => m.mapName)
}

export function buildRankedStreaks(matches: MatchPerformance[]): RankedStreak {
  const ordered = chronological(competitiveMatches(matches))
  const seq = ordered.map((m) => (m.outcome === "win" ? "W" : m.outcome === "loss" ? "L" : "D") as "W" | "L" | "D")

  let bestWin = 0
  let worstLoss = 0
  let runW = 0
  let runL = 0
  for (const r of seq) {
    runW = r === "W" ? runW + 1 : 0
    runL = r === "L" ? runL + 1 : 0
    bestWin = Math.max(bestWin, runW)
    worstLoss = Math.max(worstLoss, runL)
  }

  // current streak from the end
  let count = 0
  const lastChar = seq.at(-1)
  for (let i = seq.length - 1; i >= 0 && seq[i] === lastChar; i -= 1) count += 1
  const type = lastChar === "W" ? "win" : lastChar === "L" ? "loss" : lastChar === "D" ? "draw" : "none"

  return { results: seq.slice(-5), current: { type, count: lastChar ? count : 0 }, bestWin, worstLoss }
}

export function buildRankDistribution(matches: MatchPerformance[]): RankDistributionItem[] {
  const withTier = tiered(competitiveMatches(matches))
  const total = withTier.length
  const buckets = new Map<number, number>()
  for (const m of withTier) buckets.set(m.competitiveTier as number, (buckets.get(m.competitiveTier as number) ?? 0) + 1)
  return Array.from(buckets.entries())
    .map(([tierId, games]) => ({ tierId, tierName: tierName(tierId) ?? "—", games, percent: total ? (games / total) * 100 : 0 }))
    .sort((a, b) => b.tierId - a.tierId)
}

export function buildRankedMetrics(matches: MatchPerformance[]): ComparisonMetric[] {
  const ranked = chronological(competitiveMatches(matches))
  const mid = Math.floor(ranked.length / 2)
  const cur = ranked.slice(mid)
  const prev = ranked.slice(0, mid)
  const a = summarizeMatches(cur)
  const b = summarizeMatches(prev)
  const has = ranked.length >= 4
  const dur = (s: ReturnType<typeof summarizeMatches>) => (s.games ? s.playtimeSeconds / s.games : null)
  return [
    compareMetric("winRate", "Winrate", a.winRate, has ? b.winRate : null, true, "percent"),
    compareMetric("kd", "K/D", kdOf(cur), has ? kdOf(prev) : null, true, "ratio"),
    compareMetric("acs", "ACS", a.avgAcs, has ? b.avgAcs : null, true, "number"),
    compareMetric("hs", "HS%", a.hsPct, has ? b.hsPct : null, true, "percent"),
    compareMetric("kills", "Kills / Ronda", a.killsPerRound, has ? b.killsPerRound : null, true, "ratio"),
    compareMetric("duration", "Duración media", dur(a), has ? dur(b) : null, true, "duration"),
  ]
}

export function buildNextObjective(overview: RankedOverview): NextObjective {
  if (overview.currentTierId === null) {
    return { available: false, targetTierName: null, message: "Faltan datos de RR para estimar la subida." }
  }
  const target = tierName(overview.currentTierId + 1)
  return {
    available: true,
    targetTierName: target,
    message:
      overview.winrate !== null && overview.winrate >= 50
        ? `Mantén tu winrate del ${overview.winrate.toFixed(0)}% para subir. RR no disponible para estimar partidas exactas.`
        : "Sube tu winrate por encima del 50% para progresar. RR no disponible para estimar partidas.",
  }
}

export function buildRankedInsights(matches: MatchPerformance[]): RankedInsight[] {
  const ranked = competitiveMatches(matches)
  if (ranked.length < 4) return []
  const insights: RankedInsight[] = []
  const overall = summarizeMatches(ranked)

  // Best map vs the rest
  const maps = winrateBy(ranked, (m) => ({ key: m.mapName, name: m.mapName })).filter((r) => r.total >= 2)
  if (maps.length >= 2) {
    const best = maps.reduce((x, y) => (y.winRate > x.winRate ? y : x))
    const diff = best.winRate - overall.winRate
    if (diff > 3) insights.push({ text: `Tu winrate mejora un ${diff.toFixed(0)}% en ${best.name} comparado con otros mapas.` })
  }

  // Weakest agent K/D vs ranked average
  const agents = winrateBy(ranked, (m) => ({ key: m.agentName, name: m.agentName })).filter((r) => r.total >= 2)
  if (agents.length) {
    const avgKd = kdOf(ranked)
    const worst = agents
      .map((a) => ({ name: a.name, kd: kdOf(ranked.filter((m) => m.agentName === a.name)) }))
      .sort((x, y) => x.kd - y.kd)[0]
    if (worst && worst.kd < avgKd - 0.05) insights.push({ text: `Tu K/D con ${worst.name} está por debajo de tu media ranked.` })
  }

  // First blood correlation
  const fb = ranked.filter((m) => (m.firstBloods ?? 0) > 0)
  const noFb = ranked.filter((m) => (m.firstBloods ?? 0) === 0)
  if (fb.length >= 2 && noFb.length >= 2) {
    const fbWr = summarizeMatches(fb).winRate
    const noWr = summarizeMatches(noFb).winRate
    if (fbWr - noWr > 5) insights.push({ text: "Sueles tener mejores resultados cuando consigues la primera sangre." })
  }

  // ACS in wins vs losses
  const wins = ranked.filter((m) => m.outcome === "win")
  const losses = ranked.filter((m) => m.outcome === "loss")
  if (wins.length >= 2 && losses.length >= 2) {
    const wAcs = summarizeMatches(wins).avgAcs
    const lAcs = summarizeMatches(losses).avgAcs
    if (lAcs > 0 && wAcs - lAcs > 0) {
      const pct = ((wAcs - lAcs) / lAcs) * 100
      if (pct > 5) insights.push({ text: `Tu ACS sube un ${pct.toFixed(0)}% cuando ganas la partida.` })
    }
  }

  // Loss streak estimated RR cost (clearly labelled as estimate, ~18 RR/loss)
  const streak = buildRankedStreaks(ranked)
  if (streak.current.type === "loss" && streak.current.count >= 2) {
    insights.push({ text: `Tu racha de ${streak.current.count} derrotas te ha hecho perder ~${streak.current.count * 18} RR estimados.` })
  }

  return insights.slice(0, 5)
}
