import { notFound, redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { resolveRole } from "@/components/agents/role-icon"
import { EntityDetail } from "@/components/entity/entity-detail"
import { winrateBy } from "@/analytics/entity-stats"
import { env } from "@/lib/env"
import { toSlug } from "@/lib/slug"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getCurrentSession } from "@/server/auth/session"
import { getContentCatalog, resolveAgentContent } from "@/server/services/content-service"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { slug } = await params
  const { analytics } = await getImprovementData(session?.puuid)
  const catalog = await getContentCatalog()

  const agent = analytics.agentStats.find(
    (candidate) => toSlug(candidate.agentName || candidate.agentId || "") === slug,
  )

  if (!agent) {
    notFound()
  }

  const matches = analytics.filteredMatches.filter(
    (m) => (m.agentId || m.agentName) === (agent.agentId || agent.agentName),
  )
  const breakdownRows = winrateBy(matches, (m) => ({
    key: m.mapId || m.mapName,
    name: m.mapName,
    imageUrl: m.mapImageUrl,
    iconUrl: m.mapIconUrl,
  }))

  const role = resolveAgentContent(catalog, agent.agentId, agent.agentName)?.role
  const topAgent = [...analytics.agentStats].sort((a, b) => b.matches - a.matches)[0]
  const isTop = (agent.agentId || agent.agentName) === (topAgent?.agentId || topAgent?.agentName)

  return (
    <AppShell title={agent.agentName} subtitle="Perfil de agente" connected>
      <EntityDetail
        kind="agent"
        name={agent.agentName}
        imageUrl={getAgentAssets(agent.agentName).card ?? agent.agentImageUrl}
        subtitle={resolveRole(role).label}
        matches={matches}
        allMatches={analytics.filteredMatches}
        breakdownTitle="Mapas más jugados"
        breakdownRows={breakdownRows}
        breakdownKind="map"
        highlight={isTop ? { label: "Agente más jugado" } : null}
        backHref="/agents"
        backLabel="Volver a agentes"
      />
    </AppShell>
  )
}
