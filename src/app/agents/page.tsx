import { AppShell } from "@/components/app-shell"
import { AgentPortraitCard } from "@/components/dashboard/agent-portrait-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SectionHeader } from "@/components/dashboard/section-header"
import { getImprovementData } from "@/server/services/improvement-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const params = await searchParams
  const puuid = undefined
  const { analytics } = await getImprovementData(puuid)
  const order = params.order ?? "matches"

  const agents = [...analytics.agentStats].sort((a, b) => {
    if (order === "winrate") {
      return b.winRate - a.winRate
    }
    if (order === "kda") {
      return b.kda - a.kda
    }
    return b.matches - a.matches
  })

  return (
    <AppShell title="Agents" subtitle="Analitica por agente" connected>
      <div className="space-y-5">
        <SectionHeader
          title="Pool de agentes"
          description="Rendimiento real por agente con soporte de imagen oficial cuando Riot la expone."
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => {
              const agentMatches = analytics.filteredMatches.filter((m) => (m.agentName || m.agentId) === (agent.agentName || agent.agentId))
              return <AgentPortraitCard key={agent.agentName} agent={agent} matches={agentMatches.slice(0, 5)} />
            })}
          </div>
        ) : (
          <EmptyState
            title="Sin datos de agentes"
            description="Juega mas partidas para ver analitica por agente y recomendaciones de coach."
          />
        )}
      </div>
    </AppShell>
  )
}
