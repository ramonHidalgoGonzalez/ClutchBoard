import type { MatchPerformance } from "@/types/domain"

export function safeDivide(numerator: number, denominator: number) {
  if (!denominator) {
    return 0
  }

  return numerator / denominator
}

export function calculateWinRate(matches: MatchPerformance[]) {
  const wins = matches.filter((match) => match.outcome === "win").length
  return safeDivide(wins, matches.length) * 100
}

/**
 * Derived metric.
 * Formula: (kills + assists) / max(1, deaths)
 */
export function calculateKda(matches: MatchPerformance[]) {
  const totals = matches.reduce(
    (acc, match) => {
      acc.kills += match.kills
      acc.deaths += match.deaths
      acc.assists += match.assists
      return acc
    },
    { kills: 0, deaths: 0, assists: 0 },
  )

  return safeDivide(totals.kills + totals.assists, Math.max(1, totals.deaths))
}

/**
 * Derived metric.
 * Formula: average ACS estimate over the selected sample.
 */
export function calculateAverageAcs(matches: MatchPerformance[]) {
  return safeDivide(
    matches.reduce((sum, match) => sum + match.acsEstimate, 0),
    matches.length,
  )
}

export function calculateAverageDamage(matches: MatchPerformance[]) {
  return safeDivide(
    matches.reduce((sum, match) => sum + match.damage, 0),
    matches.length,
  )
}

/**
 * Derived metric.
 * Formula: 100 - normalized standard deviation of ACS estimates.
 */
export function calculateConsistencyScore(matches: MatchPerformance[]) {
  if (matches.length < 2) {
    return 50
  }

  const mean = calculateAverageAcs(matches)
  const variance =
    matches.reduce((sum, match) => sum + (match.acsEstimate - mean) ** 2, 0) / matches.length
  const stdev = Math.sqrt(variance)
  return Math.max(0, Math.min(100, 100 - stdev / 3))
}

/**
 * Derived metric.
 * Formula: weighted blend of win rate, KDA, ACS estimate, and first-blood advantage.
 */
export function calculateImpactScore(matches: MatchPerformance[]) {
  const winRate = calculateWinRate(matches)
  const kda = calculateKda(matches)
  const acs = calculateAverageAcs(matches)
  const fbDelta = safeDivide(
    matches.reduce((sum, match) => sum + (match.firstBloods - match.firstDeaths), 0),
    matches.length,
  )

  return Math.max(0, Math.min(100, winRate * 0.45 + kda * 12 + acs * 0.12 + fbDelta * 8))
}

/**
 * Derived metric.
 * Formula: recent 10-match win rate minus baseline win rate.
 */
export function calculateMomentum(matches: MatchPerformance[]) {
  if (!matches.length) {
    return 0
  }

  const recent = matches.slice(0, 10)
  return calculateWinRate(recent) - calculateWinRate(matches)
}

/**
 * Derived metric.
 * Formula: recent 10-match ACS average minus full-sample ACS average.
 */
export function calculateRecentDelta(matches: MatchPerformance[]) {
  if (!matches.length) {
    return 0
  }

  const recent = matches.slice(0, 10)
  return calculateAverageAcs(recent) - calculateAverageAcs(matches)
}

/**
 * Derived metric.
 * Formula: average ACS decay between the 1st and 4th+ match inside a play session.
 */
export function calculateFatigueScore(matches: MatchPerformance[]) {
  const sessions = matches.reduce<Map<number, MatchPerformance[]>>((acc, match) => {
    const session = acc.get(match.sessionIndex) ?? []
    session.push(match)
    acc.set(match.sessionIndex, session)
    return acc
  }, new Map())

  const deltas = Array.from(sessions.values())
    .filter((session) => session.length >= 4)
    .map((session) => {
      const firstHalf = calculateAverageAcs(session.slice(0, 2))
      const finalStretch = calculateAverageAcs(session.slice(-2))
      return firstHalf - finalStretch
    })

  if (!deltas.length) {
    return 0
  }

  return safeDivide(deltas.reduce((sum, value) => sum + value, 0), deltas.length)
}

/**
 * Derived metric.
 * Formula: Herfindahl-Hirschman concentration index over the agent pool, scaled 0-100.
 */
export function calculateAgentPoolConcentration(matches: MatchPerformance[]) {
  if (!matches.length) {
    return 0
  }

  const counts = matches.reduce<Record<string, number>>((acc, match) => {
    acc[match.agentName] = (acc[match.agentName] ?? 0) + 1
    return acc
  }, {})

  const concentration = Object.values(counts).reduce((sum, count) => {
    const share = count / matches.length
    return sum + share ** 2
  }, 0)

  return concentration * 100
}

/**
 * Derived metric.
 * Formula: blend of consistency, inverse fatigue, and inverse recent delta volatility.
 */
export function calculateStabilityScore(matches: MatchPerformance[]) {
  const consistency = calculateConsistencyScore(matches)
  const fatiguePenalty = Math.min(30, Math.max(0, calculateFatigueScore(matches) / 2))
  const volatilityPenalty = Math.min(20, Math.abs(calculateRecentDelta(matches)) / 4)

  return Math.max(0, Math.min(100, consistency - fatiguePenalty - volatilityPenalty))
}

/**
 * Derived metric.
 * Formula: weighted combination of momentum, stability, and improvement opportunities.
 */
export function calculateImprovementScore(matches: MatchPerformance[]) {
  const momentum = calculateMomentum(matches)
  const stability = calculateStabilityScore(matches)
  const concentration = calculateAgentPoolConcentration(matches)

  return Math.max(0, Math.min(100, 50 + momentum * 0.8 + (100 - concentration) * 0.2 + stability * 0.2))
}
