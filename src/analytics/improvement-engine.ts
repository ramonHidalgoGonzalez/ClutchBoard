import { buildAgentBreakdown, buildMapBreakdown, buildSummaryStats } from "@/analytics/metrics"
import type { ImprovementInsight, MatchPerformance } from "@/types/domain"

function buildInsight(
  partial: Omit<ImprovementInsight, "id">,
  index: number,
): ImprovementInsight {
  return {
    id: `insight-${index + 1}`,
    ...partial,
  }
}

export function generateImprovementInsights(matches: MatchPerformance[]): ImprovementInsight[] {
  const insights: ImprovementInsight[] = []
  const summary = buildSummaryStats(matches)
  const agents = buildAgentBreakdown(matches)
  const maps = buildMapBreakdown(matches)
  const recent = matches.slice(0, 10)
  const recentAcs = recent.reduce((sum, match) => sum + match.acsEstimate, 0) / Math.max(1, recent.length)
  const baselineAcs = summary.avgAcs

  const weakestAgent = [...agents]
    .filter((agent) => agent.matches >= 4)
    .sort((left, right) => left.impactScore - right.impactScore)[0]

  if (weakestAgent) {
    insights.push(
      buildInsight(
        {
          title: `Bajo impacto con ${weakestAgent.agentName}`,
          description: `Tu impacto relativo con ${weakestAgent.agentName} cae por debajo de tu pool principal en win rate, ACS y consistencia.`,
          confidence: Math.min(0.94, weakestAgent.matches / 10),
          priority: "high",
          category: "agent",
          metricKey: "agent_low_impact",
          evidence: [
            { label: "Partidas", value: String(weakestAgent.matches), source: "derived-app" },
            { label: "Impact score", value: weakestAgent.impactScore.toFixed(1), source: "derived-app" },
            { label: "Win rate", value: `${weakestAgent.winRate.toFixed(1)}%`, source: "derived-app" },
          ],
          recommendation:
            "Reduce temporalmente su pick rate en ranked y úsalo en bloques cortos de práctica con foco en duelos iniciales y supervivencia post-contacto.",
          referenceMatchIds: matches
            .filter((match) => match.agentName === weakestAgent.agentName)
            .slice(0, 3)
            .map((match) => match.matchId),
        },
        insights.length,
      ),
    )
  }

  const weakestMap = [...maps].filter((map) => map.matches >= 4).sort((left, right) => left.winRate - right.winRate)[0]

  if (weakestMap) {
    insights.push(
      buildInsight(
        {
          title: `${weakestMap.mapName} es tu mapa mas problematico`,
          description: "La muestra es suficiente para tratarlo como patrón y no como ruido puntual.",
          confidence: weakestMap.sampleLabel === "good" ? 0.88 : 0.7,
          priority: "high",
          category: "map",
          metricKey: "map_problematic",
          evidence: [
            { label: "Win rate", value: `${weakestMap.winRate.toFixed(1)}%`, source: "derived-app" },
            { label: "ACS", value: weakestMap.avgAcs.toFixed(0), source: "derived-app" },
            { label: "Muestra", value: `${weakestMap.matches} partidas`, source: "derived-app" },
          ],
          recommendation:
            "Prepara un plan fijo de agentes y utility para este mapa; evita improvisar picks y revisa tus primeras 4 rondas ofensivas de referencia.",
          referenceMatchIds: matches
            .filter((match) => match.mapName === weakestMap.mapName)
            .slice(0, 3)
            .map((match) => match.matchId),
        },
        insights.length,
      ),
    )
  }

  if (summary.fatigueScore > 18) {
    insights.push(
      buildInsight(
        {
          title: "Posible fatiga en sesiones largas",
          description:
            "Tu rendimiento cae de forma progresiva a medida que avanzan sesiones de 4+ partidas, una señal compatible con tilt o fatiga cognitiva.",
          confidence: Math.min(0.9, summary.fatigueScore / 30),
          priority: "medium",
          category: "fatigue",
          metricKey: "session_fatigue",
          evidence: [
            { label: "Fatigue score", value: summary.fatigueScore.toFixed(1), source: "derived-app" },
            { label: "Estabilidad", value: summary.stabilityScore.toFixed(1), source: "derived-app" },
            { label: "Delta ACS reciente", value: (recentAcs - baselineAcs).toFixed(1), source: "derived-app" },
          ],
          recommendation:
            "Corta la sesión al tercer partido si el segundo ya sale por debajo de tu ACS medio. Prioriza descansos de 10-15 minutos y evita cambiar de agente cuando estés cayendo.",
          referenceMatchIds: recent.slice(-3).map((match) => match.matchId),
        },
        insights.length,
      ),
    )
  }

  if (summary.concentrationScore > 42) {
    insights.push(
      buildInsight(
        {
          title: "Dependencia alta de un pool pequeño",
          description:
            "Cuando sales de tus comfort picks, la calidad del rendimiento baja demasiado. Eso te deja expuesto a drafts o mapas menos favorables.",
          confidence: Math.min(0.87, summary.concentrationScore / 60),
          priority: "medium",
          category: "consistency",
          metricKey: "agent_pool_concentration",
          evidence: [
            { label: "Concentracion", value: summary.concentrationScore.toFixed(1), source: "derived-app" },
            { label: "Agentes jugados", value: String(agents.length), source: "derived-app" },
            { label: "Score mejora", value: summary.improvementScore.toFixed(1), source: "derived-app" },
          ],
          recommendation:
            "Añade un tercer agente estable para dos mapas concretos y llévalo primero a unrated/swiftplay antes de pasarlo a ranked.",
          referenceMatchIds: matches.slice(0, 3).map((match) => match.matchId),
        },
        insights.length,
      ),
    )
  }

  if (recentAcs < baselineAcs - 18) {
    insights.push(
      buildInsight(
        {
          title: "Rendimiento reciente por debajo del baseline",
          description:
            "Tus ultimas 10 partidas están claramente por debajo de tu nivel habitual, así que conviene revisar cambios de rutina, agentes o mapas recientes.",
          confidence: 0.78,
          priority: "medium",
          category: "trend",
          metricKey: "recent_under_baseline",
          evidence: [
            { label: "ACS reciente", value: recentAcs.toFixed(1), source: "derived-app" },
            { label: "ACS baseline", value: baselineAcs.toFixed(1), source: "derived-app" },
            { label: "Momentum", value: summary.momentum.toFixed(1), source: "derived-app" },
          ],
          recommendation:
            "Haz una revisión rápida de VOD de tus ultimas 3 derrotas y busca patrones repetidos en primeros contactos, posicionamiento post-plant y timing de tradeo.",
          referenceMatchIds: recent.slice(0, 3).map((match) => match.matchId),
        },
        insights.length,
      ),
    )
  }

  return insights.slice(0, 5)
}
