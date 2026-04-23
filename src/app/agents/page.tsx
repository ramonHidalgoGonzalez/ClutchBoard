import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function AgentsPage() {
  await requireSession()
  const { agents } = await getImprovementData()

  return (
    <AppShell title="Agents" subtitle="Analisis por agente">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.agentName} className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>{agent.agentName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              <p>Partidas: {agent.matches}</p>
              <p>Win rate: {agent.winRate.toFixed(1)}%</p>
              <p>KDA: {agent.kda.toFixed(2)}</p>
              <p>ACS: {agent.avgAcs.toFixed(0)}</p>
              <p>Consistencia: {agent.consistencyScore.toFixed(0)}</p>
              <p>Impacto: {agent.impactScore.toFixed(0)}</p>
              <p>{agent.comfortPick ? "Comfort pick detectado" : "Fuera del comfort pool"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
