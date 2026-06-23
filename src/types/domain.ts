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
  mapImageUrl?: string | null
  mapIconUrl?: string | null
  agentId: string
  agentName: string
  agentImageUrl?: string | null
  agentIconUrl?: string | null
  agentSlug?: string | null
  agentAvatarUrl?: string | null
  agentPortraitUrl?: string | null
  agentBannerUrl?: string | null
  outcome: "win" | "loss" | "draw" | "unknown"
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
  agentId?: string
  agentName: string
  agentImageUrl?: string | null
  agentIconUrl?: string | null
  matches: number
  winRate: number
  kda: number
  avgAcs: number
  avgDamage: number
  consistencyScore: number
  impactScore: number
  comfortPick: boolean
  needsWork?: boolean
  sampleSize?: number
  confidence?: number
  source: DataOrigin
}

export type MapBreakdown = {
  mapId?: string
  mapName: string
  mapImageUrl?: string | null
  mapIconUrl?: string | null
  matches: number
  winRate: number
  kda: number
  avgAcs: number
  avgDamage: number
  consistencyScore: number
  sampleLabel: "small" | "medium" | "good"
  sampleSize?: number
  confidence?: number
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
  category: "map" | "agent" | "consistency" | "trend" | "sample_size" | "fatigue"
  evidence: Array<{ label: string; value: string; source: DataOrigin }>
  recommendation: string
  referenceMatchIds: string[]
  metricKey: string
  imageUrl?: string | null
  entityName?: string
}

export type AgentContent = {
  id: string
  displayName: string
  displayIconUrl: string | null
  fullPortraitUrl: string | null
  role: string | null
  fallbackColor: string
}

export type MapContent = {
  id: string
  displayName: string
  splashUrl: string | null
  listViewIconUrl: string | null
  coordinates: string | null
  fallbackColor: string
}

export type ContentCatalog = {
  version: string
  agents: AgentContent[]
  maps: MapContent[]
  lookups: {
    agentById: Map<string, AgentContent>
    agentByName: Map<string, AgentContent>
    mapById: Map<string, MapContent>
    mapByName: Map<string, MapContent>
    mapByPath: Map<string, MapContent>
  }
}

export type MatchFilter = {
  periodDays?: number
  queue?: string
}

export type RecentComparison = {
  available: boolean
  recentMatches: number
  previousMatches: number
  winRateDelta: number
  kdaDelta: number
  acsDelta: number
}

export type AnalyticsSummary = {
  totalMatches: number
  winRate: number
  averageKda: number
  averageKills: number
  averageDeaths: number
  averageAssists: number
  averageAcs: number
  averageHsPercent: number
}

export type AnalyticsPayload = {
  summary: AnalyticsSummary
  filteredMatches: MatchPerformance[]
  trend: TrendPoint[]
  mapStats: MapBreakdown[]
  agentStats: AgentBreakdown[]
  recentVsPrevious: RecentComparison
  smallSampleWarnings: string[]
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
