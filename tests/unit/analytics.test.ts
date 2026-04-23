import {
  calculateAgentPoolConcentration,
  calculateFatigueScore,
  calculateImprovementScore,
  calculateKda,
  calculateWinRate,
} from "@/analytics/formulas"
import { createMockMatches } from "@/integrations/riot/mock-data"

describe("analytics formulas", () => {
  const matches = createMockMatches(40)

  it("calculates win rate from match outcomes", () => {
    expect(calculateWinRate(matches)).toBeGreaterThan(0)
    expect(calculateWinRate(matches)).toBeLessThanOrEqual(100)
  })

  it("calculates kda using kills, deaths and assists", () => {
    expect(calculateKda(matches)).toBeGreaterThan(1)
  })

  it("estimates fatigue from long sessions", () => {
    expect(calculateFatigueScore(matches)).toBeGreaterThanOrEqual(0)
  })

  it("measures agent concentration", () => {
    expect(calculateAgentPoolConcentration(matches)).toBeGreaterThan(0)
  })

  it("returns bounded improvement score", () => {
    expect(calculateImprovementScore(matches)).toBeGreaterThanOrEqual(0)
    expect(calculateImprovementScore(matches)).toBeLessThanOrEqual(100)
  })
})
