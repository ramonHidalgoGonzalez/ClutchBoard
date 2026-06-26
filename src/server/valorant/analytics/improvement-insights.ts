/**
 * Improvement insights engine.
 *
 * Pure + deterministic: it derives an actionable diagnosis from an already
 * scope-filtered match set (the caller applies the act scope). It NEVER calls
 * Date.now / Math.random — ordering comes from match timestamps only — so the
 * same input always yields the same report and it is trivially testable.
 *
 * Output text is emitted as i18n descriptors ({ key, params }), not translated
 * strings, so the engine stays language-agnostic and the UI localizes.
 */
import { chronological, summarizeMatches } from "@/analytics/entity-stats"
import { toSlug } from "@/lib/slug"
import { competitiveMatches } from "@/server/valorant/analytics/ranked"
import type { MatchPerformance } from "@/types/domain"

export type ImprovementSeverity = "low" | "medium" | "high"

export type ImprovementInsightType =
  | "early_deaths"
  | "combat"
  | "low_impact_losses"
  | "consistency"
  | "agents"
  | "maps"
  | "ranked_progression"
  | "best_strengths"

export type TrendDir = "up" | "down" | "flat"

/** A translatable message: a dot-path key plus optional interpolation params. */
export type LocalizedText = { key: string; params?: Record<string, string | number> }

export type InsightLink =
  | { kind: "agent"; slug: string }
  | { kind: "map"; slug: string }
  | { kind: "matches" }

export type InsightEvidence = { label: LocalizedText; value: string; tone: "good" | "bad" | "neutral" }

export type ImprovementInsight = {
  id: string
  type: ImprovementInsightType
  severity: ImprovementSeverity
  /** Higher = shown first. Used for priority ordering. */
  score: number
  title: LocalizedText
  description: LocalizedText
  recommendation: LocalizedText
  evidence: InsightEvidence[]
  affectedAgents?: string[]
  affectedMaps?: string[]
  trend?: { metricKey: string; current: number; previous: number; direction: TrendDir }
  confidence: number
  link?: InsightLink
}

export type TrendMetric = {
  metricKey: string
  current: number
  previous: number
  delta: number
  direction: TrendDir
  /** true when a lower value is better (none here, but kept for clarity). */
}

export type ImprovementTrend = {
  available: boolean
  kind: "act" | "recent" | "none"
  metrics: TrendMetric[]
}

export type MapProblem = {
  mapName: string
  slug: string
  matches: number
  winRate: number
  kd: number
  acs: number
  problem: LocalizedText
  recommendation: LocalizedText
  severity: ImprovementSeverity
  priorityScore: number
}

export type AgentProblem = {
  agentName: string
  slug: string
  matches: number
  winRate: number
  kd: number
  acs: number
  worstMap: string | null
  recommendation: LocalizedText
  severity: ImprovementSeverity
  priorityScore: number
}

export type Strengths = {
  bestAgent?: { name: string; slug: string; winRate: number; matches: number }
  bestMap?: { name: string; slug: string; winRate: number; matches: number }
  mostImprovedMetric?: { metricKey: string; delta: number }
  bestCombo?: { agentName: string; mapName: string; winRate: number; matches: number }
}

export type TrainingTask = { id: string; text: LocalizedText; focus: LocalizedText }

export type ImprovementReport = {
  sampleSize: number
  minSample: number
  sufficient: boolean
  insights: ImprovementInsight[]
  priorities: ImprovementInsight[]
  trainingTasks: TrainingTask[]
  strengths: Strengths
  mapProblems: MapProblem[]
  agentProblems: AgentProblem[]
  trend: ImprovementTrend
}

export type ImprovementInput = {
  matches: MatchPerformance[]
  /** Previous comparison set (e.g. the previous act) for the trend section. */
  previousMatches?: MatchPerformance[]
  /** Minimum matches before insights are considered reliable. Default 8. */
  minSample?: number
}

// ── Tuning ──────────────────────────────────────────────────────────────────
const DEFAULT_MIN_SAMPLE = 8
const MIN_ENTITY = 4 // map/agent reliability threshold
const MIN_COMBO = 3
const MIN_TREND = 5

const TARGET = {
  acs: { ok: 210, low: 180 },
  kd: { ok: 1.15, low: 1.0 },
  hs: { ok: 22, low: 18 },
  adr: { ok: 150, low: 130 },
}

// ── Small numeric helpers ─────────────────────────────────────────────────────
function sum(values: number[]) {
  return values.reduce((acc, v) => acc + v, 0)
}
function mean(values: number[]) {
  return values.length ? sum(values) / values.length : 0
}
function stdev(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)))
}
function round(value: number, digits = 0) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
function pct(value: number) {
  return `${round(value)}%`
}
function dir(delta: number, eps: number): TrendDir {
  if (delta > eps) return "up"
  if (delta < -eps) return "down"
  return "flat"
}
function severityFromGap(gap: number, mediumAt: number, highAt: number): ImprovementSeverity {
  if (gap >= highAt) return "high"
  if (gap >= mediumAt) return "medium"
  return "low"
}
function severityWeight(s: ImprovementSeverity) {
  return s === "high" ? 3 : s === "medium" ? 2 : 1
}

type SetStats = {
  games: number
  winRate: number
  kd: number
  kda: number
  acs: number
  hs: number
  adr: number
  firstDeathRate: number
}

function rounds(ms: MatchPerformance[]) {
  return sum(ms.map((m) => (m.roundsWon ?? 0) + (m.roundsLost ?? 0)))
}

function setStats(ms: MatchPerformance[]): SetStats {
  const s = summarizeMatches(ms)
  const r = Math.max(1, rounds(ms))
  return {
    games: s.games,
    winRate: s.winRate,
    kd: s.kd,
    kda: s.kda,
    acs: s.avgAcs,
    hs: s.hsPct,
    adr: sum(ms.map((m) => m.damage ?? 0)) / r,
    firstDeathRate: sum(ms.map((m) => m.firstDeaths ?? 0)) / r,
  }
}

function groupBy(ms: MatchPerformance[], key: (m: MatchPerformance) => string) {
  const map = new Map<string, MatchPerformance[]>()
  for (const m of ms) {
    const k = key(m)
    const list = map.get(k) ?? []
    list.push(m)
    map.set(k, list)
  }
  return map
}

const sevSort = (a: { severity: ImprovementSeverity; priorityScore: number }, b: typeof a) =>
  severityWeight(b.severity) - severityWeight(a.severity) || b.priorityScore - a.priorityScore

// ── Insight builders ──────────────────────────────────────────────────────────
function earlyDeathsInsight(matches: MatchPerformance[], overall: SetStats): ImprovementInsight | null {
  const losses = matches.filter((m) => m.outcome === "loss")
  if (losses.length < MIN_ENTITY) return null
  const lossRate = setStats(losses).firstDeathRate * 100
  if (lossRate < 16) return null
  const severity = severityFromGap(lossRate, 16, 22)
  return {
    id: "early_deaths",
    type: "early_deaths",
    severity,
    score: severityWeight(severity) * 100 + lossRate,
    title: { key: "improvement.insight.earlyDeaths.title" },
    description: { key: "improvement.insight.earlyDeaths.desc", params: { rate: round(lossRate) } },
    recommendation: { key: "improvement.insight.earlyDeaths.rec" },
    evidence: [
      { label: { key: "improvement.evidence.firstDeathLosses" }, value: pct(lossRate), tone: "bad" },
      { label: { key: "improvement.evidence.firstDeathOverall" }, value: pct(overall.firstDeathRate * 100), tone: "neutral" },
    ],
    confidence: confidenceFor(losses.length),
    link: { kind: "matches" },
  }
}

function combatInsight(overall: SetStats): ImprovementInsight | null {
  const candidates: Array<{ metricKey: string; value: number; target: { ok: number; low: number }; format: (v: number) => string }> = [
    { metricKey: "acs", value: overall.acs, target: TARGET.acs, format: (v) => String(round(v)) },
    { metricKey: "kd", value: overall.kd, target: TARGET.kd, format: (v) => round(v, 2).toFixed(2) },
    { metricKey: "hs", value: overall.hs, target: TARGET.hs, format: (v) => pct(v) },
    { metricKey: "adr", value: overall.adr, target: TARGET.adr, format: (v) => String(round(v)) },
  ]
  // Worst relative deficit below the "ok" target.
  const scored = candidates
    .map((c) => ({ ...c, deficit: (c.target.ok - c.value) / c.target.ok }))
    .filter((c) => c.value < c.target.low)
    .sort((a, b) => b.deficit - a.deficit)
  const worst = scored[0]
  if (!worst) return null
  const gap = worst.deficit * 100
  const severity = severityFromGap(gap, 8, 16)
  return {
    id: "combat",
    type: "combat",
    severity,
    score: severityWeight(severity) * 100 + gap,
    title: { key: `improvement.insight.combat.title.${worst.metricKey}` },
    description: {
      key: `improvement.insight.combat.desc.${worst.metricKey}`,
      params: { value: worst.format(worst.value), target: worst.format(worst.target.ok) },
    },
    recommendation: { key: `improvement.insight.combat.rec.${worst.metricKey}` },
    evidence: [
      { label: { key: `improvement.metric.${worst.metricKey}` }, value: worst.format(worst.value), tone: "bad" },
      { label: { key: "improvement.evidence.target" }, value: worst.format(worst.target.ok), tone: "good" },
    ],
    confidence: confidenceFor(overall.games),
    link: { kind: "matches" },
  }
}

function lowImpactLossesInsight(matches: MatchPerformance[]): ImprovementInsight | null {
  const losses = matches.filter((m) => m.outcome === "loss")
  const wins = matches.filter((m) => m.outcome === "win")
  if (losses.length < MIN_ENTITY || wins.length < MIN_ENTITY) return null
  const lossAcs = setStats(losses).acs
  const winAcs = setStats(wins).acs
  if (winAcs <= 0 || lossAcs >= winAcs * 0.88) return null
  const drop = ((winAcs - lossAcs) / winAcs) * 100
  const severity = severityFromGap(drop, 12, 22)
  return {
    id: "low_impact_losses",
    type: "low_impact_losses",
    severity,
    score: severityWeight(severity) * 100 + drop,
    title: { key: "improvement.insight.lowImpactLosses.title" },
    description: { key: "improvement.insight.lowImpactLosses.desc", params: { lossAcs: round(lossAcs), winAcs: round(winAcs) } },
    recommendation: { key: "improvement.insight.lowImpactLosses.rec" },
    evidence: [
      { label: { key: "improvement.evidence.acsLosses" }, value: String(round(lossAcs)), tone: "bad" },
      { label: { key: "improvement.evidence.acsWins" }, value: String(round(winAcs)), tone: "good" },
    ],
    confidence: confidenceFor(losses.length),
    link: { kind: "matches" },
  }
}

function consistencyInsight(matches: MatchPerformance[], overall: SetStats): ImprovementInsight | null {
  if (matches.length < DEFAULT_MIN_SAMPLE) return null
  const acsValues = matches.map((m) => m.acsEstimate ?? 0)
  const sd = stdev(acsValues)
  const cv = overall.acs > 0 ? sd / overall.acs : 0
  if (cv < 0.24) return null
  const severity = severityFromGap(cv * 100, 24, 34)
  return {
    id: "consistency",
    type: "consistency",
    severity,
    score: severityWeight(severity) * 100 + cv * 100,
    title: { key: "improvement.insight.consistency.title" },
    description: { key: "improvement.insight.consistency.desc", params: { cv: round(cv * 100) } },
    recommendation: { key: "improvement.insight.consistency.rec" },
    evidence: [
      { label: { key: "improvement.evidence.acsVariance" }, value: `±${round(sd)}`, tone: "bad" },
      { label: { key: "improvement.metric.acs" }, value: String(round(overall.acs)), tone: "neutral" },
    ],
    confidence: confidenceFor(matches.length),
    link: { kind: "matches" },
  }
}

function worstAgentInsight(matches: MatchPerformance[], overall: SetStats): ImprovementInsight | null {
  const agentProblems = buildAgentProblems(matches, overall)
  const worst = agentProblems[0]
  if (!worst || worst.severity === "low") return null
  return {
    id: `agent:${worst.slug}`,
    type: "agents",
    severity: worst.severity,
    score: severityWeight(worst.severity) * 100 + worst.priorityScore,
    title: { key: "improvement.insight.agent.title", params: { agent: worst.agentName } },
    description: {
      key: "improvement.insight.agent.desc",
      params: { agent: worst.agentName, winrate: round(worst.winRate), matches: worst.matches },
    },
    recommendation: worst.recommendation,
    evidence: [
      { label: { key: "improvement.metric.winrate" }, value: pct(worst.winRate), tone: "bad" },
      { label: { key: "improvement.metric.kd" }, value: round(worst.kd, 2).toFixed(2), tone: "neutral" },
    ],
    affectedAgents: [worst.agentName],
    affectedMaps: worst.worstMap ? [worst.worstMap] : undefined,
    confidence: confidenceFor(worst.matches),
    link: { kind: "agent", slug: worst.slug },
  }
}

function worstMapInsight(matches: MatchPerformance[], overall: SetStats): ImprovementInsight | null {
  const mapProblems = buildMapProblems(matches, overall)
  const worst = mapProblems[0]
  if (!worst || worst.severity === "low") return null
  return {
    id: `map:${worst.slug}`,
    type: "maps",
    severity: worst.severity,
    score: severityWeight(worst.severity) * 100 + worst.priorityScore,
    title: { key: "improvement.insight.map.title", params: { map: worst.mapName } },
    description: {
      key: "improvement.insight.map.desc",
      params: { map: worst.mapName, winrate: round(worst.winRate), matches: worst.matches },
    },
    recommendation: worst.recommendation,
    evidence: [
      { label: { key: "improvement.metric.winrate" }, value: pct(worst.winRate), tone: "bad" },
      { label: { key: "improvement.metric.acs" }, value: String(round(worst.acs)), tone: "neutral" },
    ],
    affectedMaps: [worst.mapName],
    confidence: confidenceFor(worst.matches),
    link: { kind: "map", slug: worst.slug },
  }
}

function rankedProgressionInsight(matches: MatchPerformance[]): ImprovementInsight | null {
  const comp = competitiveMatches(matches)
  if (comp.length < MIN_TREND) return null
  const ordered = chronological(comp)
  // Current losing streak from the most recent backwards.
  let streak = 0
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (ordered[i].outcome === "loss") streak++
    else break
  }
  const mid = Math.floor(ordered.length / 2)
  const older = setStats(ordered.slice(0, mid))
  const recent = setStats(ordered.slice(mid))
  const winDelta = recent.winRate - older.winRate
  const declining = ordered.length >= 8 && winDelta <= -8
  if (streak < 3 && !declining) return null
  const severity: ImprovementSeverity = streak >= 4 || winDelta <= -15 ? "high" : "medium"
  return {
    id: "ranked_progression",
    type: "ranked_progression",
    severity,
    score: severityWeight(severity) * 100 + Math.max(streak * 4, Math.abs(winDelta)),
    title: { key: "improvement.insight.ranked.title" },
    description: {
      key: streak >= 3 ? "improvement.insight.ranked.descStreak" : "improvement.insight.ranked.descTrend",
      params: { streak, delta: round(Math.abs(winDelta)) },
    },
    recommendation: { key: "improvement.insight.ranked.rec" },
    evidence: [
      { label: { key: "improvement.evidence.lossStreak" }, value: String(streak), tone: "bad" },
      { label: { key: "improvement.evidence.rankedGames" }, value: String(comp.length), tone: "neutral" },
    ],
    confidence: confidenceFor(comp.length),
    link: { kind: "matches" },
  }
}

function strengthsInsight(strengths: Strengths): ImprovementInsight | null {
  if (!strengths.bestAgent && !strengths.bestMap) return null
  const best = strengths.bestAgent ?? null
  return {
    id: "best_strengths",
    type: "best_strengths",
    severity: "low",
    score: -1, // never a "problem priority"
    title: { key: "improvement.insight.strengths.title" },
    description: best
      ? { key: "improvement.insight.strengths.desc", params: { agent: best.name, winrate: round(best.winRate) } }
      : { key: "improvement.insight.strengths.descMap", params: { map: strengths.bestMap!.name, winrate: round(strengths.bestMap!.winRate) } },
    recommendation: { key: "improvement.insight.strengths.rec" },
    evidence: best
      ? [{ label: { key: "improvement.metric.winrate" }, value: pct(best.winRate), tone: "good" }]
      : [{ label: { key: "improvement.metric.winrate" }, value: pct(strengths.bestMap!.winRate), tone: "good" }],
    confidence: 0.6,
    link: best ? { kind: "agent", slug: best.slug } : { kind: "map", slug: strengths.bestMap!.slug },
  }
}

function confidenceFor(sample: number) {
  if (sample >= 20) return 1
  if (sample >= 12) return 0.8
  if (sample >= 8) return 0.65
  if (sample >= 4) return 0.45
  return 0.25
}

// ── Per-entity problem tables ─────────────────────────────────────────────────
function buildMapProblems(matches: MatchPerformance[], overall: SetStats): MapProblem[] {
  const groups = groupBy(matches, (m) => m.mapId || m.mapName || "unknown")
  const rows: MapProblem[] = []
  for (const bucket of groups.values()) {
    if (bucket.length < MIN_ENTITY) continue
    const s = setStats(bucket)
    const name = bucket[0].mapName || "Unknown Map"
    const winGap = overall.winRate - s.winRate
    const { problem, recommendation } = mapDiagnosis(s, overall)
    const priorityScore = Math.max(0, winGap) * Math.sqrt(bucket.length)
    const severity: ImprovementSeverity =
      winGap >= 15 ? "high" : winGap >= 7 || s.winRate < 45 ? "medium" : "low"
    rows.push({
      mapName: name,
      slug: toSlug(name),
      matches: bucket.length,
      winRate: round(s.winRate),
      kd: round(s.kd, 2),
      acs: round(s.acs),
      problem,
      recommendation,
      severity,
      priorityScore,
    })
  }
  return rows.sort(sevSort)
}

function mapDiagnosis(s: SetStats, overall: SetStats): { problem: LocalizedText; recommendation: LocalizedText } {
  if (s.firstDeathRate > overall.firstDeathRate * 1.2 && s.firstDeathRate > 0.16) {
    return { problem: { key: "improvement.mapProblem.earlyEntries" }, recommendation: { key: "improvement.mapRec.earlyEntries" } }
  }
  if (s.acs < overall.acs * 0.9) {
    return { problem: { key: "improvement.mapProblem.lowImpact" }, recommendation: { key: "improvement.mapRec.lowImpact" } }
  }
  if (s.kd < 0.95) {
    return { problem: { key: "improvement.mapProblem.lowKd" }, recommendation: { key: "improvement.mapRec.lowKd" } }
  }
  if (s.winRate < 45) {
    return { problem: { key: "improvement.mapProblem.lowWinrate" }, recommendation: { key: "improvement.mapRec.lowWinrate" } }
  }
  return { problem: { key: "improvement.mapProblem.inconsistent" }, recommendation: { key: "improvement.mapRec.inconsistent" } }
}

function buildAgentProblems(matches: MatchPerformance[], overall: SetStats): AgentProblem[] {
  const groups = groupBy(matches, (m) => m.agentId || m.agentName || "unknown")
  const rows: AgentProblem[] = []
  for (const bucket of groups.values()) {
    if (bucket.length < MIN_ENTITY) continue
    const s = setStats(bucket)
    const name = bucket[0].agentName || "Unknown Agent"
    const winGap = overall.winRate - s.winRate
    // Worst map this agent plays (min winrate among that agent's maps, sample>=2).
    const mapGroups = groupBy(bucket, (m) => m.mapName || "unknown")
    let worstMap: string | null = null
    let worstMapWin = Infinity
    for (const mb of mapGroups.values()) {
      if (mb.length < 2) continue
      const mw = setStats(mb).winRate
      if (mw < worstMapWin) {
        worstMapWin = mw
        worstMap = mb[0].mapName || null
      }
    }
    const priorityScore = Math.max(0, winGap) * Math.sqrt(bucket.length)
    const severity: ImprovementSeverity =
      winGap >= 15 ? "high" : winGap >= 7 || s.winRate < 45 ? "medium" : "low"
    rows.push({
      agentName: name,
      slug: toSlug(name),
      matches: bucket.length,
      winRate: round(s.winRate),
      kd: round(s.kd, 2),
      acs: round(s.acs),
      worstMap,
      recommendation: agentRecommendation(s),
      severity,
      priorityScore,
    })
  }
  return rows.sort(sevSort)
}

function agentRecommendation(s: SetStats): LocalizedText {
  if (s.firstDeathRate > 0.18) return { key: "improvement.agentRec.utility" }
  if (s.kd < 0.95) return { key: "improvement.agentRec.trades" }
  if (s.acs < TARGET.acs.low) return { key: "improvement.agentRec.impact" }
  if (s.winRate >= 55) return { key: "improvement.agentRec.keepGoing" }
  return { key: "improvement.agentRec.positioning" }
}

// ── Strengths ─────────────────────────────────────────────────────────────────
function buildStrengths(matches: MatchPerformance[], trend: ImprovementTrend): Strengths {
  const strengths: Strengths = {}

  const agentGroups = [...groupBy(matches, (m) => m.agentName || "unknown").values()].filter((b) => b.length >= MIN_ENTITY)
  const bestAgentBucket = agentGroups
    .map((b) => ({ name: b[0].agentName || "Unknown Agent", s: setStats(b), n: b.length }))
    .sort((a, z) => z.s.winRate - a.s.winRate || z.n - a.n)[0]
  if (bestAgentBucket && bestAgentBucket.s.winRate >= 50) {
    strengths.bestAgent = {
      name: bestAgentBucket.name,
      slug: toSlug(bestAgentBucket.name),
      winRate: round(bestAgentBucket.s.winRate),
      matches: bestAgentBucket.n,
    }
  }

  const mapGroups = [...groupBy(matches, (m) => m.mapName || "unknown").values()].filter((b) => b.length >= MIN_ENTITY)
  const bestMapBucket = mapGroups
    .map((b) => ({ name: b[0].mapName || "Unknown Map", s: setStats(b), n: b.length }))
    .sort((a, z) => z.s.winRate - a.s.winRate || z.n - a.n)[0]
  if (bestMapBucket && bestMapBucket.s.winRate >= 50) {
    strengths.bestMap = {
      name: bestMapBucket.name,
      slug: toSlug(bestMapBucket.name),
      winRate: round(bestMapBucket.s.winRate),
      matches: bestMapBucket.n,
    }
  }

  // Most improved metric from the trend (largest positive delta).
  const improved = [...trend.metrics]
    .filter((m) => m.direction === "up")
    .sort((a, b) => b.delta - a.delta)[0]
  if (improved) strengths.mostImprovedMetric = { metricKey: improved.metricKey, delta: round(improved.delta, 2) }

  // Best agent+map combo (sample >= MIN_COMBO).
  const combo = [...groupBy(matches, (m) => `${m.agentName}@@${m.mapName}`).values()]
    .filter((b) => b.length >= MIN_COMBO)
    .map((b) => ({ agentName: b[0].agentName || "?", mapName: b[0].mapName || "?", s: setStats(b), n: b.length }))
    .sort((a, z) => z.s.winRate - a.s.winRate || z.n - a.n)[0]
  if (combo && combo.s.winRate >= 55) {
    strengths.bestCombo = { agentName: combo.agentName, mapName: combo.mapName, winRate: round(combo.s.winRate), matches: combo.n }
  }

  return strengths
}

// ── Trend ─────────────────────────────────────────────────────────────────────
function buildTrend(matches: MatchPerformance[], previous?: MatchPerformance[]): ImprovementTrend {
  let current = matches
  let prior: MatchPerformance[] | null = null
  let kind: ImprovementTrend["kind"] = "none"

  if (previous && previous.length >= MIN_TREND && matches.length >= MIN_TREND) {
    prior = previous
    kind = "act"
  } else if (matches.length >= 2 * MIN_TREND) {
    const ordered = chronological(matches)
    const mid = Math.floor(ordered.length / 2)
    prior = ordered.slice(0, mid)
    current = ordered.slice(mid)
    kind = "recent"
  }

  if (!prior) return { available: false, kind: "none", metrics: [] }

  const c = setStats(current)
  const p = setStats(prior)
  const metrics: TrendMetric[] = [
    metric("acs", c.acs, p.acs, 4),
    metric("kd", c.kd, p.kd, 0.05),
    metric("adr", c.adr, p.adr, 4),
    metric("winrate", c.winRate, p.winRate, 3),
    metric("games", c.games, p.games, 0.5),
  ]
  return { available: true, kind, metrics }
}

function metric(metricKey: string, current: number, previous: number, eps: number): TrendMetric {
  const delta = current - previous
  return { metricKey, current: round(current, metricKey === "kd" ? 2 : 0), previous: round(previous, metricKey === "kd" ? 2 : 0), delta: round(delta, 2), direction: dir(delta, eps) }
}

// ── Training tasks ────────────────────────────────────────────────────────────
function buildTrainingTasks(priorities: ImprovementInsight[]): TrainingTask[] {
  const tasks: TrainingTask[] = []
  for (const insight of priorities) {
    tasks.push(taskForInsight(insight))
    if (tasks.length >= 3) break
  }
  // Pad with generic, metric-based tasks when there are < 3 priorities.
  const generic: TrainingTask[] = [
    { id: "generic-aim", text: { key: "improvement.train.generic.aim" }, focus: { key: "improvement.focus.aim" } },
    { id: "generic-review", text: { key: "improvement.train.generic.review" }, focus: { key: "improvement.focus.mapKnowledge" } },
    { id: "generic-warmup", text: { key: "improvement.train.generic.warmup" }, focus: { key: "improvement.focus.patience" } },
  ]
  for (const g of generic) {
    if (tasks.length >= 3) break
    if (!tasks.some((t) => t.id === g.id)) tasks.push(g)
  }
  return tasks.slice(0, 3)
}

function taskForInsight(insight: ImprovementInsight): TrainingTask {
  switch (insight.type) {
    case "early_deaths":
      return { id: "task-early", text: { key: "improvement.train.earlyDeaths" }, focus: { key: "improvement.focus.survival" } }
    case "maps":
      return { id: `task-map`, text: { key: "improvement.train.map", params: { map: insight.affectedMaps?.[0] ?? "" } }, focus: { key: "improvement.focus.mapKnowledge" } }
    case "agents":
      return { id: `task-agent`, text: { key: "improvement.train.agent", params: { agent: insight.affectedAgents?.[0] ?? "" } }, focus: { key: "improvement.focus.utility" } }
    case "low_impact_losses":
      return { id: "task-impact", text: { key: "improvement.train.lowImpact" }, focus: { key: "improvement.focus.mentality" } }
    case "consistency":
      return { id: "task-consistency", text: { key: "improvement.train.consistency" }, focus: { key: "improvement.focus.mentality" } }
    case "ranked_progression":
      return { id: "task-ranked", text: { key: "improvement.train.ranked" }, focus: { key: "improvement.focus.mentality" } }
    case "combat":
    default:
      return { id: "task-combat", text: { key: "improvement.train.combat" }, focus: { key: "improvement.focus.aim" } }
  }
}

// ── Public entry point ────────────────────────────────────────────────────────
export function buildImprovementReport(input: ImprovementInput): ImprovementReport {
  const matches = input.matches ?? []
  const minSample = input.minSample ?? DEFAULT_MIN_SAMPLE
  const sampleSize = matches.length
  const sufficient = sampleSize >= minSample
  const overall = setStats(matches)
  const trend = buildTrend(matches, input.previousMatches)
  const strengths = buildStrengths(matches, trend)
  const mapProblems = buildMapProblems(matches, overall)
  const agentProblems = buildAgentProblems(matches, overall)

  // Build problem insights only when the sample is reliable, so we never invent
  // patterns from a handful of games.
  const problemInsights: ImprovementInsight[] = []
  if (sufficient) {
    const builders = [
      earlyDeathsInsight(matches, overall),
      lowImpactLossesInsight(matches),
      combatInsight(overall),
      consistencyInsight(matches, overall),
      worstAgentInsight(matches, overall),
      worstMapInsight(matches, overall),
      rankedProgressionInsight(matches),
    ]
    for (const b of builders) if (b) problemInsights.push(b)
  }
  problemInsights.sort((a, b) => b.score - a.score)

  const strengthInsight = strengthsInsight(strengths)
  const priorities = problemInsights.slice(0, 3)
  const trainingTasks = sufficient ? buildTrainingTasks(priorities) : buildTrainingTasks([])

  const insights = [...problemInsights]
  if (strengthInsight) insights.push(strengthInsight)

  return {
    sampleSize,
    minSample,
    sufficient,
    insights,
    priorities,
    trainingTasks,
    strengths,
    mapProblems,
    agentProblems,
    trend,
  }
}
