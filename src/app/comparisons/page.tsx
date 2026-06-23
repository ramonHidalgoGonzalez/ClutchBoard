import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { ComparisonsView } from "@/components/comparisons/comparisons-view"
import { EmptyState } from "@/components/dashboard/empty-state"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function ComparisonsPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { analytics } = await getImprovementData(session?.puuid)
  const matches = analytics.filteredMatches
  const agents = analytics.agentStats.map((a) => a.agentName).filter(Boolean)
  const maps = analytics.mapStats.map((m) => m.mapName).filter(Boolean)

  return (
    <AppShell
      title="Comparativas"
      subtitle="Compara tu rendimiento por periodo, agente, mapa y resultado."
      connected
      lastSyncedAt={new Date().toISOString()}
    >
      {matches.length === 0 ? (
        <EmptyState
          title="Sin partidas todavía"
          description="Cuando Riot sincronice tus partidas podrás comparar tu rendimiento."
        />
      ) : (
        <ComparisonsView matches={matches} agents={agents} maps={maps} now={new Date().getTime()} />
      )}
    </AppShell>
  )
}
