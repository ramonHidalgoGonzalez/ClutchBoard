import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MetricCard } from "@/components/dashboard/metric-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { AgentDistributionChart } from "@/components/charts/agent-distribution-chart"
import { FatigueChart } from "@/components/charts/fatigue-chart"
import { MapPerformanceChart } from "@/components/charts/map-performance-chart"
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart"
import { MatchResultBadge } from "@/components/dashboard/match-result-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentMatchesPanel } from "@/features/matches/recent-matches-panel"
import { requireSession } from "@/server/auth/session"
import { getDashboardPayload } from "@/server/services/dashboard-service"
import { Activity, Brain, Crosshair, MapPinned, Sparkles, Swords } from "lucide-react"

function getMatchesAnalyzed(payload: Awaited<ReturnType<typeof getDashboardPayload>>) {
  return payload.mapBreakdown.reduce((sum, item) => sum + item.matches, 0)
}

function getWeightedWinRate(payload: Awaited<ReturnType<typeof getDashboardPayload>>) {
  const matches = getMatchesAnalyzed(payload)
  if (!matches) {
    return null
  }

  const winsEstimate = payload.agentBreakdown.reduce((sum, item) => sum + (item.winRate / 100) * item.matches, 0)
  return (winsEstimate / matches) * 100
}

export default async function DashboardPage() {
  const session = await requireSession()

  const payload = await getDashboardPayload({
    puuid: session.puuid,
    gameName: session.gameName,
    tagLine: session.tagLine,
  })

  const matchesAnalyzed = getMatchesAnalyzed(payload)
  const winRate = getWeightedWinRate(payload)
  const topMap = payload.mapBreakdown[0]
  const topAgent = payload.agentBreakdown[0]
  const trendDelta = payload.kpis[0]?.delta
  const trendDirection = !trendDelta ? "flat" : trendDelta > 0 ? "up" : "down"
  const bestMap = payload.mapBreakdown.filter((map) => map.matches >= 4).sort((a, b) => b.winRate - a.winRate)[0]
  const worstMap = payload.mapBreakdown.filter((map) => map.matches >= 4).sort((a, b) => a.winRate - b.winRate)[0]
  const mostConsistentAgent = payload.agentBreakdown
    .filter((agent) => agent.matches >= 4)
    .sort((a, b) => b.consistencyScore - a.consistencyScore)[0]
  const lowSample = matchesAnalyzed < 12

  return (
    <AppShell
      title="Dashboard"
      subtitle={`${session.gameName}#${session.tagLine}`}
      connected
      lastSyncedAt={payload.metadata.lastSyncedAt}
    >
      <div className="space-y-6">
        {payload.metadata.matchesFetchFailed ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
            <p>No se pudieron cargar las partidas.</p>
            <p>{payload.metadata.matchesFetchMessage ?? "Riot devolvio un error al consultar VAL-MATCH-V1."}</p>
            <p>Tu cuenta esta conectada correctamente.</p>
          </div>
        ) : null}

        <Card className="glass-panel text-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">Jugador autenticado</p>
              <p className="text-2xl font-semibold">{session.gameName}#{session.tagLine}</p>
              <p className="text-xs text-zinc-500">Cuenta Riot conectada y lista para sincronizar nuevas partidas.</p>
            </div>
            <MatchResultBadge outcome="win" />
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Partidas analizadas"
            value={matchesAnalyzed ? String(matchesAnalyzed) : "Calculando..."}
            helper={matchesAnalyzed ? "Muestra total disponible" : "Necesitamos mas partidas"}
            icon={<Activity className="size-4 text-zinc-400" />}
          />
          <MetricCard
            label="Winrate"
            value={typeof winRate === "number" ? `${winRate.toFixed(1)}%` : "Datos insuficientes"}
            helper="Basado en historial agregado"
            trend={trendDirection}
            delta={trendDelta}
            icon={<Swords className="size-4 text-zinc-400" />}
          />
          <MetricCard
            label="KDA promedio"
            value={payload.kpis[1]?.displayValue ?? "Calculando..."}
            helper="Kills + assists / deaths"
            trend={payload.kpis[1]?.trend}
            delta={payload.kpis[1]?.delta}
            icon={<Crosshair className="size-4 text-zinc-400" />}
          />
          <MetricCard
            label="Mapa mas jugado"
            value={topMap?.mapName ?? "Unknown Map"}
            helper={topMap ? `${topMap.matches} partidas` : "Necesitamos mas partidas"}
            icon={<MapPinned className="size-4 text-zinc-400" />}
          />
          <MetricCard
            label="Agente mas jugado"
            value={topAgent?.agentName ?? "Unknown Agent"}
            helper={topAgent ? `${topAgent.matches} partidas` : "Necesitamos mas partidas"}
            icon={<Brain className="size-4 text-zinc-400" />}
          />
          <MetricCard
            label="Tendencia reciente"
            value={typeof trendDelta === "number" ? `${trendDelta >= 0 ? "+" : ""}${trendDelta.toFixed(1)}` : "Calculando..."}
            helper="Momentum sobre el bloque reciente"
            trend={trendDirection}
            delta={trendDelta}
            icon={<Sparkles className="size-4 text-zinc-400" />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Tendencia 60 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.trends.length ? (
                <PerformanceTrendChart data={payload.trends} />
              ) : (
                <EmptyState
                  title="No hay tendencia disponible"
                  description="Necesitamos mas partidas para calcular una evolucion fiable de rendimiento."
                />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Insights rapidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Mejor mapa</p>
                <p className="mt-1 text-zinc-100">{bestMap ? `${bestMap.mapName} (${bestMap.winRate.toFixed(1)}%)` : "Datos insuficientes"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Peor mapa</p>
                <p className="mt-1 text-zinc-100">{worstMap ? `${worstMap.mapName} (${worstMap.winRate.toFixed(1)}%)` : "Datos insuficientes"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Agente mas consistente</p>
                <p className="mt-1 text-zinc-100">
                  {mostConsistentAgent
                    ? `${mostConsistentAgent.agentName} (${mostConsistentAgent.consistencyScore.toFixed(0)}/100)`
                    : "Datos insuficientes"}
                </p>
              </div>
              {lowSample ? (
                <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-3 text-amber-100">
                  Muestra pequena: necesitamos mas partidas para recomendaciones estables.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Pool de agentes</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.agentBreakdown.length ? (
                <AgentDistributionChart data={payload.agentBreakdown.slice(0, 6)} />
              ) : (
                <EmptyState title="Sin datos de agentes" description="Aun no hay suficiente historial para esta grafica." />
              )}
            </CardContent>
          </Card>
          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Rendimiento por mapa</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.mapBreakdown.length ? (
                <MapPerformanceChart data={payload.mapBreakdown.slice(0, 6)} />
              ) : (
                <EmptyState title="Sin datos de mapas" description="Juega mas partidas para activar esta vista." />
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Fatiga por sesion</CardTitle>
            </CardHeader>
            <CardContent>
              {payload.trends.length ? (
                <FatigueChart data={payload.trends} />
              ) : (
                <EmptyState title="Sin datos de fatiga" description="Todavia no hay sesiones suficientes para estimar fatiga." />
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="glass-panel text-white">
          <CardHeader>
            <SectionHeader
              title="Ultimas partidas"
              description="Resultado, mapa, agente y eficiencia de tus ultimos encuentros."
            />
          </CardHeader>
          <CardContent>
            <RecentMatchesPanel />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
