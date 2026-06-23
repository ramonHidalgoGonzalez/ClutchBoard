import { notFound, redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { AgentDetail } from "@/components/agents/agent-detail"
import { env } from "@/lib/env"
import { toSlug } from "@/lib/slug"
import { getCurrentSession } from "@/server/auth/session"
import { getContentCatalog, resolveAgentContent } from "@/server/services/content-service"
import { getImprovementData } from "@/server/services/improvement-service"
import { buildAgentProfile } from "@/server/valorant/analytics/agent-profile"
import { buildRankedMapStats, buildRankedOverview } from "@/server/valorant/analytics/ranked"

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const role = resolveAgentContent(catalog, agent.agentId, agent.agentName)?.role
  const topAgent = [...analytics.agentStats].sort((a, b) => b.matches - a.matches)[0]
  const isTop = (agent.agentId || agent.agentName) === (topAgent?.agentId || topAgent?.agentName)

  const profile = buildAgentProfile(matches, analytics.filteredMatches, analytics.filteredMatches.length)
  const rankedMapStats = buildRankedMapStats(matches)
  const ranked = {
    overview: buildRankedOverview(matches),
    bestMap: rankedMapStats[0]?.name ?? null,
    worstMap: rankedMapStats.length > 1 ? rankedMapStats[rankedMapStats.length - 1]?.name : null,
  }

  return (
    <AppShell title={agent.agentName} subtitle="Perfil de agente" connected lastSyncedAt={new Date().toISOString()}>
      <AgentDetail name={agent.agentName} role={role} profile={profile} isTop={isTop} now={new Date().getTime()} ranked={ranked} />
    </AppShell>
  )
}
