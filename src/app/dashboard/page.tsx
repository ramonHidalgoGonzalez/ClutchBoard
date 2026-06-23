import Link from "next/link"
import { redirect } from "next/navigation"
import { Crosshair, Shield, Star, Swords, Target, Trophy } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { DashboardTrendChart } from "@/components/dashboard/dashboard-trend-chart"
import { EmptyState } from "@/components/dashboard/empty-state"
import { EntityHeroMini } from "@/components/dashboard/entity-hero-mini"
import { QuickInsights } from "@/components/dashboard/quick-insights"
import { RecentMatchesTable } from "@/components/dashboard/recent-matches-table"
import { RolePerformance, type RoleRow } from "@/components/dashboard/role-performance"
import { ResultsDonut } from "@/components/dashboard/results-donut"
import { WinrateDonut } from "@/components/stats/winrate-donut"
import { Card, CardContent } from "@/components/ui/card"
import { lastN, summarizeMatches } from "@/analytics/entity-stats"
import { resolveAgentRole } from "@/lib/agent-roles"
import { resolveAgentVisual } from "@/server/valorant/content/agent-assets"
import { env } from "@/lib/env"
import { toSlug } from "@/lib/slug"
import { getCurrentSession } from "@/server/auth/session"
import { getContentCatalog, resolveAgentContent } from "@/server/services/content-service"
import { getImprovementData } from "@/server/services/improvement-service"
import type { MatchPerformance } from "@/types/domain"

function Delta({ value, suffix = "" }: { value?: number; suffix?: string }) {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) < 0.05) {
    return null
  }
  const positive = value > 0
  const rounded = Math.abs(value) >= 10 ? Math.round(Math.abs(value)) : Math.abs(value).toFixed(2)
  return (
    <span className={positive ? "text-xs font-semibold text-emerald-400" : "text-xs font-semibold text-rose-400"}>
      {positive ? "▲" : "▼"} {rounded}
      {suffix}
    </span>
  )
}

function Tile({
  label,
  value,
  icon,
  accent,
  sub,
  right,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent: string
  sub?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            <span className={accent}>{icon}</span>
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
          {sub ? <div className="mt-0.5 text-xs text-zinc-400">{sub}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}

function buildRoleRows(matches: MatchPerformance[], catalog: Awaited<ReturnType<typeof getContentCatalog>>): RoleRow[] {
  const buckets = new Map<string, MatchPerformance[]>()
  for (const match of matches) {
    const contentRole = resolveAgentContent(catalog, match.agentId, match.agentName)?.role
    const role = resolveAgentRole(match.agentName, contentRole)
    if (!role) {
      continue
    }
    const list = buckets.get(role) ?? []
    list.push(match)
    buckets.set(role, list)
  }
  return Array.from(buckets.entries())
    .map(([label, bucket]) => {
      const summary = summarizeMatches(bucket)
      return { label, kda: summary.kda, winRate: summary.winRate, matches: summary.games }
    })
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)
}

export default async function DashboardPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { analytics } = await getImprovementData(session?.puuid)
  const catalog = await getContentCatalog()

  const matches = analytics.filteredMatches
  const summary = analytics.summary
  const rvp = analytics.recentVsPrevious
  const totals = summarizeMatches(matches)

  const wins = matches.filter((m) => m.outcome === "win").length
  const losses = matches.filter((m) => m.outcome === "loss").length
  const draws = matches.filter((m) => m.outcome === "draw").length

  const bestMap = [...analytics.mapStats]
    .filter((m) => (m.sampleSize ?? 0) >= 4)
    .sort((a, b) => b.winRate - a.winRate)[0]
  const worstMap = [...analytics.mapStats]
    .filter((m) => (m.sampleSize ?? 0) >= 4)
    .sort((a, b) => a.winRate - b.winRate)[0]
  const topAgent = [...analytics.agentStats].sort((a, b) => b.matches - a.matches)[0]
  const consistentAgent = [...analytics.agentStats]
    .filter((a) => (a.sampleSize ?? 0) >= 4)
    .sort((a, b) => b.consistencyScore - a.consistencyScore)[0]

  const roleRows = buildRoleRows(matches, catalog)
  const playerName = session?.gameName ?? "jugador"

  return (
    <AppShell
      title={`¡Bienvenido de vuelta, ${playerName}!`}
      subtitle="Aquí tienes tu rendimiento reciente en VALORANT."
      connected
      lastSyncedAt={new Date().toISOString()}
    >
      {matches.length === 0 ? (
        <EmptyState
          title="Sin partidas todavía"
          description="Cuando Riot sincronice tus partidas verás aquí tu rendimiento."
        />
      ) : (
        <div className="space-y-5">
          {/* Stat row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Tile
              label="Partidas"
              value={String(summary.totalMatches)}
              icon={<Crosshair className="size-3.5" />}
              accent="text-indigo-300"
              sub={`Últimos ${summary.totalMatches}`}
            />
            <Tile
              label="Winrate"
              value={`${summary.winRate.toFixed(1)}%`}
              icon={<Trophy className="size-3.5" />}
              accent="text-emerald-300"
              right={<WinrateDonut value={summary.winRate} />}
              sub={`${wins} Victorias / ${losses} Derrotas`}
            />
            <Tile
              label="KDA promedio"
              value={summary.averageKda.toFixed(2)}
              icon={<Swords className="size-3.5" />}
              accent="text-sky-300"
              sub={rvp.available ? <Delta value={rvp.kdaDelta} /> : null}
            />
            <Tile
              label="ACS promedio"
              value={summary.averageAcs.toFixed(0)}
              icon={<Star className="size-3.5" />}
              accent="text-amber-300"
              sub={rvp.available ? <Delta value={rvp.acsDelta} /> : null}
            />
            <Tile
              label="HS% promedio"
              value={`${summary.averageHsPercent.toFixed(1)}%`}
              icon={<Target className="size-3.5" />}
              accent="text-rose-300"
            />
            <Tile
              label="K/D"
              value={totals.kd.toFixed(2)}
              icon={<Shield className="size-3.5" />}
              accent="text-violet-300"
              sub={`${totals.kills} / ${totals.deaths}`}
            />
          </div>

          {/* Main grid */}
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="glass-panel text-white">
                  <CardContent className="space-y-3 p-5">
                    <p className="text-sm font-semibold text-zinc-300">Tendencia de rendimiento (60 días)</p>
                    {analytics.trend.length >= 2 ? (
                      <DashboardTrendChart data={analytics.trend} />
                    ) : (
                      <p className="py-10 text-center text-sm text-zinc-500">
                        Necesitas más partidas para la tendencia.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card className="glass-panel text-white">
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-semibold text-zinc-300">Distribución de resultados</p>
                    <ResultsDonut wins={wins} losses={losses} draws={draws} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {bestMap ? (
                  <EntityHeroMini
                    kind="map"
                    eyebrow="Mejor mapa"
                    name={bestMap.mapName}
                    imageUrl={bestMap.mapImageUrl}
                    winRate={bestMap.winRate}
                    matches={bestMap.matches}
                    star
                    href={`/maps/${toSlug(bestMap.mapName)}`}
                  />
                ) : null}
                {topAgent ? (
                  <EntityHeroMini
                    kind="agent"
                    eyebrow="Agente más jugado"
                    name={topAgent.agentName}
                    imageUrl={resolveAgentVisual(topAgent.agentName).hero}
                    winRate={topAgent.winRate}
                    matches={topAgent.matches}
                    href={`/agents/${toSlug(topAgent.agentName)}`}
                  />
                ) : null}
              </div>

              <Card className="glass-panel text-white">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-semibold text-zinc-300">Últimas partidas</p>
                  <RecentMatchesTable matches={lastN(matches, 5)} />
                  <Link
                    href="/matches"
                    className="block pt-1 text-center text-sm font-semibold text-rose-300 hover:text-rose-200"
                  >
                    Ver todas las partidas
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card className="glass-panel text-white">
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-semibold text-zinc-300">Insights rápidos</p>
                  <QuickInsights
                    bestMap={bestMap}
                    worstMap={worstMap}
                    consistentAgent={consistentAgent}
                    trend={{ acsDelta: rvp.acsDelta, available: rvp.available }}
                  />
                </CardContent>
              </Card>

              <Card className="glass-panel text-white">
                <CardContent className="space-y-4 p-5">
                  <p className="text-sm font-semibold text-zinc-300">Rendimiento por rol</p>
                  <RolePerformance rows={roleRows} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
