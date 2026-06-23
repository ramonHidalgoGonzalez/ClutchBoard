import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { VisualAgentCard } from "@/components/agents/visual-agent-card"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SectionHeader } from "@/components/dashboard/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getContentCatalog, resolveAgentContent } from "@/server/services/content-service"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const params = await searchParams
  const order = typeof params.order === "string" ? params.order : "matches"
  const scope = resolveScopeFromSearchParams(params)
  const { analytics, acts, syncedTotal } = await getImprovementData(session?.puuid, scope)
  const catalog = await getContentCatalog()

  const agents = [...analytics.agentStats].sort((a, b) => {
    if (order === "winrate") {
      return b.winRate - a.winRate
    }
    if (order === "kda") {
      return b.kda - a.kda
    }
    return b.matches - a.matches
  })

  const t = await getTranslations()

  return (
    <AppShell title={t("agents.title")} subtitle={t("agents.subtitle")} connected>
      <div className="space-y-5">
        <div className="flex justify-end">
          <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
        </div>
        <SectionHeader
          title="Pool de agentes"
          description="Rendimiento real por agente. Haz clic en un agente para ver su perfil completo."
          actions={
            <form>
              <Select name="order" defaultValue={order}>
                <SelectTrigger className="w-40 border-white/15 bg-white/5 text-zinc-100">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matches">Partidas</SelectItem>
                  <SelectItem value="winrate">Winrate</SelectItem>
                  <SelectItem value="kda">KDA</SelectItem>
                </SelectContent>
              </Select>
            </form>
          }
        />

        {analytics.smallSampleWarnings.length ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {analytics.smallSampleWarnings[0]}
          </div>
        ) : null}

        {agents.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => {
              const agentMatches = analytics.filteredMatches.filter(
                (m) => (m.agentId || m.agentName) === (agent.agentId || agent.agentName),
              )
              const role = resolveAgentContent(catalog, agent.agentId, agent.agentName)?.role

              return (
                <VisualAgentCard
                  key={agent.agentId || agent.agentName}
                  agent={agent}
                  matches={agentMatches}
                  role={role}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="Sin datos de agentes"
            description="Juega más partidas para ver analítica por agente y recomendaciones de coach."
          />
        )}
      </div>
    </AppShell>
  )
}
