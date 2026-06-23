import type { AnalyticsPayload, ImprovementInsight } from "@/types/domain"
import { getAnalyticsPayload } from "@/server/services/analytics-service"

function makeInsight(id: string, payload: Omit<ImprovementInsight, "id">): ImprovementInsight {
  return {
    id,
    ...payload,
  }
}

export async function getCoachInsights(puuid?: string): Promise<ImprovementInsight[]> {
  return buildCoachInsights(await getAnalyticsPayload(puuid))
}

export function buildCoachInsights(analytics: AnalyticsPayload): ImprovementInsight[] {
  const insights: ImprovementInsight[] = []
  const { filteredMatches, summary, mapStats, agentStats, recentVsPrevious, smallSampleWarnings } = analytics

  if (filteredMatches.length < 5) {
    insights.push(
      makeInsight("sample-size-low", {
        title: "Datos insuficientes",
        description: "Necesitamos mas partidas para generar recomendaciones fiables.",
        priority: "high",
        confidence: 100,
        category: "sample_size",
        evidence: [{ label: "Partidas", value: String(filteredMatches.length), source: "derived-app" }],
        recommendation: "Juega al menos 5-10 partidas adicionales para obtener señales estables.",
        referenceMatchIds: filteredMatches.slice(0, 3).map((match) => match.matchId),
        metricKey: "sample_size",
      }),
    )
    return insights
  }

  const worstMap = mapStats.filter((map) => (map.sampleSize ?? 0) >= 4).sort((a, b) => a.winRate - b.winRate)[0]
  const bestMap = mapStats.filter((map) => (map.sampleSize ?? 0) >= 4).sort((a, b) => b.winRate - a.winRate)[0]
  const weakAgent = agentStats
    .filter((agent) => (agent.sampleSize ?? 0) >= 4)
    .sort((a, b) => a.winRate - b.winRate)[0]
  const comfortAgent = agentStats.sort((a, b) => b.matches - a.matches)[0]

  if (worstMap) {
    insights.push(
      makeInsight("worst-map", {
        title: `${worstMap.mapName} es tu mapa mas debil`,
        description: "Tu winrate en este mapa esta por debajo de tu baseline global.",
        priority: "high",
        confidence: Math.round((worstMap.confidence ?? 0.5) * 100),
        category: "map",
        evidence: [
          { label: "Winrate mapa", value: `${worstMap.winRate.toFixed(1)}%`, source: "derived-app" },
          { label: "Winrate global", value: `${summary.winRate.toFixed(1)}%`, source: "derived-app" },
          { label: "Muestra", value: `${worstMap.matches} partidas`, source: "derived-app" },
        ],
        recommendation: "Practica planes de utilidad y posicionamiento para este mapa antes de volver a ranked.",
        referenceMatchIds: filteredMatches.filter((match) => match.mapName === worstMap.mapName).slice(0, 3).map((match) => match.matchId),
        metricKey: "worst_map",
        imageUrl: worstMap.mapImageUrl,
        entityName: worstMap.mapName,
      }),
    )
  }

  if (bestMap) {
    insights.push(
      makeInsight("best-map", {
        title: `${bestMap.mapName} es tu mapa mas fuerte`,
        description: "Aprovecha este mapa para consolidar consistencia en ranked.",
        priority: "low",
        confidence: Math.round((bestMap.confidence ?? 0.5) * 100),
        category: "map",
        evidence: [
          { label: "Winrate", value: `${bestMap.winRate.toFixed(1)}%`, source: "derived-app" },
          { label: "KDA", value: bestMap.kda.toFixed(2), source: "derived-app" },
        ],
        recommendation: "Replica las mismas rutinas de apertura en otros mapas similares.",
        referenceMatchIds: filteredMatches.filter((match) => match.mapName === bestMap.mapName).slice(0, 3).map((match) => match.matchId),
        metricKey: "best_map",
        imageUrl: bestMap.mapImageUrl,
        entityName: bestMap.mapName,
      }),
    )
  }

  if (weakAgent && weakAgent.winRate + 6 < summary.winRate) {
    insights.push(
      makeInsight("weak-agent", {
        title: `${weakAgent.agentName} esta rindiendo por debajo de tu media`,
        description: "Tu winrate con este agente cae respecto al baseline general.",
        priority: "medium",
        confidence: Math.round((weakAgent.confidence ?? 0.5) * 100),
        category: "agent",
        evidence: [
          { label: "Winrate agente", value: `${weakAgent.winRate.toFixed(1)}%`, source: "derived-app" },
          { label: "Winrate global", value: `${summary.winRate.toFixed(1)}%`, source: "derived-app" },
          { label: "Partidas", value: `${weakAgent.matches}`, source: "derived-app" },
        ],
        recommendation: "Reduce temporalmente su pick rate y practica escenarios clave en partidas no competitivas.",
        referenceMatchIds: filteredMatches.filter((match) => match.agentName === weakAgent.agentName).slice(0, 3).map((match) => match.matchId),
        metricKey: "weak_agent",
        imageUrl: weakAgent.agentImageUrl,
        entityName: weakAgent.agentName,
      }),
    )
  }

  if (comfortAgent && comfortAgent.matches >= Math.max(6, filteredMatches.length * 0.2)) {
    insights.push(
      makeInsight("comfort-pick", {
        title: `${comfortAgent.agentName} es tu comfort pick`,
        description: "Concentras gran parte de tus partidas en este agente.",
        priority: "low",
        confidence: Math.round((comfortAgent.confidence ?? 0.5) * 100),
        category: "agent",
        evidence: [
          { label: "Partidas", value: `${comfortAgent.matches}`, source: "derived-app" },
          { label: "KDA", value: comfortAgent.kda.toFixed(2), source: "derived-app" },
        ],
        recommendation: "Mantelo como pick principal, pero desarrolla un segundo agente estable para reducir dependencia.",
        referenceMatchIds: filteredMatches.filter((match) => match.agentName === comfortAgent.agentName).slice(0, 3).map((match) => match.matchId),
        metricKey: "comfort_pick",
        imageUrl: comfortAgent.agentImageUrl,
        entityName: comfortAgent.agentName,
      }),
    )
  }

  if (recentVsPrevious.available && recentVsPrevious.winRateDelta < -10) {
    insights.push(
      makeInsight("recent-drop", {
        title: "Caida reciente de rendimiento",
        description: "Tus ultimas partidas muestran un descenso claro respecto al bloque anterior.",
        priority: "high",
        confidence: 85,
        category: "trend",
        evidence: [
          { label: "Delta winrate", value: `${recentVsPrevious.winRateDelta.toFixed(1)}%`, source: "derived-app" },
          { label: "Delta KDA", value: recentVsPrevious.kdaDelta.toFixed(2), source: "derived-app" },
          { label: "Delta ACS", value: recentVsPrevious.acsDelta.toFixed(1), source: "derived-app" },
        ],
        recommendation: "Haz una pausa corta y revisa tus ultimas derrotas para identificar errores repetidos de timing y posicionamiento.",
        referenceMatchIds: filteredMatches.slice(0, 5).map((match) => match.matchId),
        metricKey: "recent_drop",
      }),
    )
  }

  if (smallSampleWarnings.length) {
    insights.push(
      makeInsight("sample-warning", {
        title: "Advertencia de muestra",
        description: "Parte de las metricas se apoyan en muestras pequenas.",
        priority: "medium",
        confidence: 100,
        category: "sample_size",
        evidence: smallSampleWarnings.map((warning) => ({ label: "Warning", value: warning, source: "derived-app" })),
        recommendation: "Interpreta tendencias con cautela hasta acumular mas partidas por mapa y agente.",
        referenceMatchIds: filteredMatches.slice(0, 3).map((match) => match.matchId),
        metricKey: "sample_warning",
      }),
    )
  }

  return insights.slice(0, 6)
}
