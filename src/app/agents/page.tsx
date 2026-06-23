import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { AgentPoolCard } from "@/components/agents/agent-pool-card"
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
  searchParams: Promise<{ order?: string }>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const params = await searchParams
  const order = params.order ?? "matches"
  const { analytics } = await getImprovementData(session?.puuid)
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

  const topAgentKey = [...analytics.agentStats].sort((a, b) => b.matches - a.matches)[0]
  const topKey = topAgentKey?.agentId || topAgentKey?.agentName

  return (
    <AppShell title="Agents" subtitle="Analítica por agente" connected>
      <div className="space-y-5">
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
          <div className="space-y-5">
            {agents.map((agent) => {
              const agentMatches = analytics.filteredMatches.filter(
                (m) => (m.agentId || m.agentName) === (agent.agentId || agent.agentName),
              )
              const role = resolveAgentContent(catalog, agent.agentId, agent.agentName)?.role
              const isTop = (agent.agentId || agent.agentName) === topKey

              return (
                <AgentPoolCard
                  key={agent.agentId || agent.agentName}
                  agent={agent}
                  matches={agentMatches}
                  role={role}
                  isTop={isTop}
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
