import { subDays } from "date-fns"

import {
  calculateAgentPoolConcentration,
  calculateAverageAcs,
  calculateAverageDamage,
  calculateConsistencyScore,
  calculateFatigueScore,
  calculateImpactScore,
  calculateImprovementScore,
  calculateKda,
  calculateMomentum,
  calculateRecentDelta,
  calculateStabilityScore,
  calculateWinRate,
} from "@/analytics/formulas"
import type {
  AgentBreakdown,
  ComparisonSummary,
  KpiMetric,
  MapBreakdown,
  MatchPerformance,
  TrendPoint,
} from "@/types/domain"

export function buildKpis(matches: MatchPerformance[]): KpiMetric[] {
  const recent = matches.slice(0, 10)

  return [
    {
      label: "Win rate reciente",
      value: calculateWinRate(recent),
      displayValue: `${calculateWinRate(recent).toFixed(1)}%`,
      trend: calculateMomentum(matches) >= 0 ? "up" : "down",
      delta: calculateMomentum(matches),
      source: "derived-app",
      formula: "wins / matches * 100",
    },
    {
      label: "KDA",
      value: calculateKda(recent),
      displayValue: calculateKda(recent).toFixed(2),
      trend: calculateRecentDelta(matches) >= 0 ? "up" : "down",
      delta: calculateRecentDelta(matches),
      source: "derived-app",
      formula: "(kills + assists) / max(1, deaths)",
    },
    {
      label: "ACS estimado",
      value: calculateAverageAcs(recent),
      displayValue: calculateAverageAcs(recent).toFixed(0),
      trend: calculateRecentDelta(matches) >= 0 ? "up" : "down",
      delta: calculateRecentDelta(matches),
      source: "derived-app",
      formula: "average(match.acsEstimate)",
    },
    {
      label: "Estabilidad",
      value: calculateStabilityScore(matches),
      displayValue: `${calculateStabilityScore(matches).toFixed(0)}/100`,
      trend: "flat",
      source: "derived-app",
      formula: "consistency - fatigue penalty - volatility penalty",
    },
  ]
}

export function buildAgentBreakdown(matches: MatchPerformance[]): AgentBreakdown[] {
  const byAgent = matches.reduce<Map<string, MatchPerformance[]>>((acc, match) => {
    const bucket = acc.get(match.agentName) ?? []
    bucket.push(match)
    acc.set(match.agentName, bucket)
    return acc
  }, new Map())

  return Array.from(byAgent.entries())
    .map(([agentName, bucket]) => ({
      agentName,
      matches: bucket.length,
      winRate: calculateWinRate(bucket),
      kda: calculateKda(bucket),
      avgAcs: calculateAverageAcs(bucket),
      avgDamage: calculateAverageDamage(bucket),
      consistencyScore: calculateConsistencyScore(bucket),
      impactScore: calculateImpactScore(bucket),
      comfortPick: bucket.length >= Math.max(6, matches.length * 0.18),
      source: "derived-app" as const,
    }))
    .sort((left, right) => right.matches - left.matches)
}

export function buildMapBreakdown(matches: MatchPerformance[]): MapBreakdown[] {
  const byMap = matches.reduce<Map<string, MatchPerformance[]>>((acc, match) => {
    const bucket = acc.get(match.mapName) ?? []
    bucket.push(match)
    acc.set(match.mapName, bucket)
    return acc
  }, new Map())

  return Array.from(byMap.entries())
    .map(([mapName, bucket]) => ({
      mapName,
      matches: bucket.length,
      winRate: calculateWinRate(bucket),
      kda: calculateKda(bucket),
      avgAcs: calculateAverageAcs(bucket),
      avgDamage: calculateAverageDamage(bucket),
      consistencyScore: calculateConsistencyScore(bucket),
      sampleLabel: (bucket.length >= 8 ? "good" : bucket.length >= 4 ? "medium" : "small") as
        | "good"
        | "medium"
        | "small",
      source: "derived-app" as const,
    }))
    .sort((left, right) => right.matches - left.matches)
}

export function buildTrendPoints(matches: MatchPerformance[], windowDays = 30): TrendPoint[] {
  return Array.from({ length: Math.min(windowDays, 12) }, (_, index) => {
    const daysAgo = (11 - index) * Math.max(1, Math.floor(windowDays / 12))
    const threshold = subDays(new Date(), daysAgo)
    const sample = matches.filter((match) => new Date(match.startedAt) >= threshold).slice(0, 12)

    return {
      label: `${windowDays - daysAgo}d`,
      date: threshold.toISOString(),
      winRate: calculateWinRate(sample),
      kda: calculateKda(sample),
      avgAcs: calculateAverageAcs(sample),
      avgDamage: calculateAverageDamage(sample),
      fatigueScore: calculateFatigueScore(sample),
    }
  })
}

export function buildComparisons(matches: MatchPerformance[]): ComparisonSummary[] {
  const latest20 = matches.slice(0, 20)
  const previous20 = matches.slice(20, 40)
  const agentBreakdown = buildAgentBreakdown(matches)
  const mapBreakdown = buildMapBreakdown(matches)
  const [topAgent, secondAgent] = agentBreakdown
  const [topMap, secondMap] = mapBreakdown

  const comparisons: ComparisonSummary[] = [
    {
      title: "Ultimos 20 vs 20 anteriores",
      leftLabel: "Ultimos 20",
      rightLabel: "20 anteriores",
      metrics: [
        {
          metric: "Win rate",
          left: calculateWinRate(latest20),
          right: calculateWinRate(previous20),
          delta: calculateWinRate(latest20) - calculateWinRate(previous20),
        },
        {
          metric: "KDA",
          left: calculateKda(latest20),
          right: calculateKda(previous20),
          delta: calculateKda(latest20) - calculateKda(previous20),
        },
        {
          metric: "ACS",
          left: calculateAverageAcs(latest20),
          right: calculateAverageAcs(previous20),
          delta: calculateAverageAcs(latest20) - calculateAverageAcs(previous20),
        },
      ],
    },
  ]

  if (topAgent && secondAgent) {
    comparisons.push({
      title: `${topAgent.agentName} vs ${secondAgent.agentName}`,
      leftLabel: topAgent.agentName,
      rightLabel: secondAgent.agentName,
      metrics: [
        { metric: "Win rate", left: topAgent.winRate, right: secondAgent.winRate, delta: topAgent.winRate - secondAgent.winRate },
        { metric: "KDA", left: topAgent.kda, right: secondAgent.kda, delta: topAgent.kda - secondAgent.kda },
        { metric: "Impacto", left: topAgent.impactScore, right: secondAgent.impactScore, delta: topAgent.impactScore - secondAgent.impactScore },
      ],
    })
  }

  if (topMap && secondMap) {
    comparisons.push({
      title: `${topMap.mapName} vs ${secondMap.mapName}`,
      leftLabel: topMap.mapName,
      rightLabel: secondMap.mapName,
      metrics: [
        { metric: "Win rate", left: topMap.winRate, right: secondMap.winRate, delta: topMap.winRate - secondMap.winRate },
        { metric: "KDA", left: topMap.kda, right: secondMap.kda, delta: topMap.kda - secondMap.kda },
        { metric: "ACS", left: topMap.avgAcs, right: secondMap.avgAcs, delta: topMap.avgAcs - secondMap.avgAcs },
      ],
    })
  }

  const ranked = matches.filter((match) => match.queueName === "Competitive")
  const casual = matches.filter((match) => match.queueName !== "Competitive")

  if (ranked.length && casual.length) {
    comparisons.push({
      title: "Ranked vs casual",
      leftLabel: "Ranked",
      rightLabel: "Casual",
      metrics: [
        { metric: "Win rate", left: calculateWinRate(ranked), right: calculateWinRate(casual), delta: calculateWinRate(ranked) - calculateWinRate(casual) },
        { metric: "KDA", left: calculateKda(ranked), right: calculateKda(casual), delta: calculateKda(ranked) - calculateKda(casual) },
        { metric: "ACS", left: calculateAverageAcs(ranked), right: calculateAverageAcs(casual), delta: calculateAverageAcs(ranked) - calculateAverageAcs(casual) },
      ],
    })
  }

  return comparisons
}

export function buildSummaryStats(matches: MatchPerformance[]) {
  return {
    winRate: calculateWinRate(matches),
    kda: calculateKda(matches),
    avgAcs: calculateAverageAcs(matches),
    avgDamage: calculateAverageDamage(matches),
    momentum: calculateMomentum(matches),
    fatigueScore: calculateFatigueScore(matches),
    stabilityScore: calculateStabilityScore(matches),
    concentrationScore: calculateAgentPoolConcentration(matches),
    improvementScore: calculateImprovementScore(matches),
  }
}
