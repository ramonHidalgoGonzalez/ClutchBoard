export type TrendDirection = "up" | "down" | "flat"
export type InsightPriority = "high" | "medium" | "low"
export type DataOrigin = "official-riot" | "derived-app" | "mock-demo"

export type AccountProfile = {
  puuid: string
  gameName: string
  tagLine: string
  region: string
  platform: string
  linkedAt: string
  lastSyncedAt: string
  source: DataOrigin
}

export type MatchPerformance = {
  matchId: string
  startedAt: string
  durationSeconds: number
  queueId: string
  queueName: string
  gameMode: string
  mapId: string
  mapName: string
  agentId: string
  agentName: string
  outcome: "win" | "loss" | "draw"
  roundsWon: number
  roundsLost: number
  kills: number
  deaths: number
  assists: number
  damage: number
  headshots: number
  bodyshots: number
  legshots: number
  firstBloods: number
  firstDeaths: number
  clutches: number
  score: number
  acsEstimate: number
  headshotPct: number
  sessionIndex: number
  source: DataOrigin
  officialFields: string[]
  derivedFields: string[]
}

export type KpiMetric = {
  label: string
  value: number
  displayValue: string
  trend?: TrendDirection
  delta?: number
  source: DataOrigin
  formula?: string
}

export type AgentBreakdown = {
  agentName: string
  matches: number
  winRate: number
  kda: number
  avgAcs: number
  avgDamage: number
  consistencyScore: number
  impactScore: number
  comfortPick: boolean
  source: DataOrigin
}

export type MapBreakdown = {
  mapName: string
  matches: number
  winRate: number
  kda: number
  avgAcs: number
  avgDamage: number
  consistencyScore: number
  sampleLabel: "small" | "medium" | "good"
  source: DataOrigin
}

export type TrendPoint = {
  label: string
  date: string
  winRate: number
  kda: number
  avgAcs: number
  avgDamage: number
  fatigueScore: number
}

export type ComparisonSummary = {
  title: string
  leftLabel: string
  rightLabel: string
  metrics: Array<{
    metric: string
    left: number
    right: number
    delta: number
  }>
}

export type ImprovementInsight = {
  id: string
  title: string
  description: string
  confidence: number
  priority: InsightPriority
  evidence: Array<{ label: string; value: string; source: DataOrigin }>
  recommendation: string
  referenceMatchIds: string[]
  metricKey: string
}

export type DashboardPayload = {
  profile: AccountProfile
  kpis: KpiMetric[]
  recentMatches: MatchPerformance[]
  trends: TrendPoint[]
  agentBreakdown: AgentBreakdown[]
  mapBreakdown: MapBreakdown[]
  improvementInsights: ImprovementInsight[]
  comparisons: ComparisonSummary[]
  platformStatus: {
    label: string
    incidents: number
    maintenances: number
    source: DataOrigin
  }
  metadata: {
    mode: "mock" | "riot"
    lastSyncedAt: string
    matchesFetchFailed?: boolean
    matchesFetchMessage?: string
    officialDataNotes: string[]
    derivedDataNotes: string[]
  }
}
