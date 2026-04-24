import { AppShell } from "@/components/app-shell"
import { GameMediaCard } from "@/components/game-media-card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function AgentsPage() {
  await requireSession()
  const { agents, content } = await getImprovementData()

  return (
    <AppShell title="Agents" subtitle="Analisis por agente">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <GameMediaCard
            key={agent.agentName}
            kind="agent"
            name={agent.agentName}
            officialAssetPath={content?.characters.find((item) => item.name === agent.agentName)?.assetPath}
            title={agent.agentName}
            subtitle={
              agent.matches === 0
                ? "Sin partidas registradas aun"
                : agent.comfortPick
                  ? "Comfort pick detectado"
                  : "Fuera del comfort pool"
            }
            stats={[
              { label: "Partidas", value: String(agent.matches) },
              { label: "Win rate", value: `${agent.winRate.toFixed(1)}%` },
              { label: "KDA", value: agent.kda.toFixed(2) },
              { label: "ACS", value: agent.avgAcs.toFixed(0) },
              { label: "Consistencia", value: agent.consistencyScore.toFixed(0) },
              { label: "Impacto", value: agent.impactScore.toFixed(0) },
            ]}
            footer={
              agent.matches === 0
                ? "Aparece por catalogo oficial aunque todavia no tenga muestra. En cuanto lo juegues, Clutchboard rellenara sus metricas."
                : "La tarjeta usa asset oficial si Riot lo expone en content; si no, Clutchboard pinta un artwork interno de fallback."
            }
          />
        ))}
      </div>
    </AppShell>
  )
}
