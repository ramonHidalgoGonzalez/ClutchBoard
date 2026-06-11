import { AppShell } from "@/components/app-shell"
import { AgentDistributionChart } from "@/components/charts/agent-distribution-chart"
import { FatigueChart } from "@/components/charts/fatigue-chart"
import { MapPerformanceChart } from "@/components/charts/map-performance-chart"
import { PerformanceTrendChart } from "@/components/charts/performance-trend-chart"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentMatchesPanel } from "@/features/matches/recent-matches-panel"
import { env } from "@/lib/env"
import { headers } from "next/headers"
import { requireSession } from "@/server/auth/session"
import { getDashboardPayload } from "@/server/services/dashboard-service"

type MeResponse = {
  authenticated: boolean
  account: {
    puuid: string
    gameName: string
    tagLine: string
  } | null
}

async function getCurrentAccountFromApi(): Promise<MeResponse> {
  const cookie = (await headers()).get("cookie")
  const response = await fetch(`${env.appUrl}/api/me`, {
    method: "GET",
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("No se pudo consultar /api/me")
  }

  return response.json() as Promise<MeResponse>
}

export default async function DashboardPage() {
  await requireSession()
  const me = await getCurrentAccountFromApi()

  if (!me.authenticated || !me.account) {
    throw new Error("Sesion valida, pero no se pudo resolver la cuenta autenticada.")
  }

  const payload = await getDashboardPayload({
    puuid: me.account.puuid,
    gameName: me.account.gameName,
    tagLine: me.account.tagLine,
  })

  return (
    <AppShell title="Dashboard" subtitle={`${me.account.gameName}#${me.account.tagLine}`}>
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
            <RecentMatchesPanel />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
