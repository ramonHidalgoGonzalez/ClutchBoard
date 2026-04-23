import { AppShell } from "@/components/app-shell"
import { AgentDistributionChart } from "@/components/charts/agent-distribution-chart"
import { FatigueChart } from "@/components/charts/fatigue-chart"
import { MapPerformanceChart } from "@/components/charts/map-performance-chart"
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchTable } from "@/features/matches/match-table"
import { requireSession } from "@/server/auth/session"
import { getDashboardPayload } from "@/server/services/dashboard-service"

export default async function DashboardPage() {
  const session = await requireSession()
  const payload = await getDashboardPayload(session.puuid)

  return (
    <AppShell title="Dashboard" subtitle={`${payload.profile.gameName}#${payload.profile.tagLine}`}>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {payload.kpis.map((metric) => (
            <StatCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Tendencia 60 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceTrendChart data={payload.trends} />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Pool de agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentDistributionChart data={payload.agentBreakdown.slice(0, 6)} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Rendimiento por mapa</CardTitle>
            </CardHeader>
            <CardContent>
              <MapPerformanceChart data={payload.mapBreakdown.slice(0, 6)} />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Fatiga por sesion</CardTitle>
            </CardHeader>
            <CardContent>
              <FatigueChart data={payload.trends} />
            </CardContent>
          </Card>
        </section>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Ultimas partidas</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchTable matches={payload.recentMatches} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
