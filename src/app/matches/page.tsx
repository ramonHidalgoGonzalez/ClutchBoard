import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MatchHistory } from "@/components/matches/match-history"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MatchesPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { analytics } = await getImprovementData(session?.puuid)
  const matches = analytics.filteredMatches

  const bestMap = [...analytics.mapStats]
    .filter((map) => (map.sampleSize ?? 0) >= 4)
    .sort((a, b) => b.winRate - a.winRate)[0]
  const topAgent = [...analytics.agentStats].sort((a, b) => b.matches - a.matches)[0]
  const lastSyncedAt = new Date().toISOString()
  const t = await getTranslations()

  return (
    <AppShell
      title={t("matches.title")}
      subtitle={t("matches.subtitle")}
      connected
      lastSyncedAt={lastSyncedAt}
    >
      {matches.length ? (
        <MatchHistory
          matches={matches}
          summary={analytics.summary}
          bestMap={bestMap ?? null}
          topAgent={topAgent ?? null}
          recentVsPrevious={analytics.recentVsPrevious}
          lastSyncedAt={lastSyncedAt}
        />
      ) : (
        <EmptyState
          title="No hay partidas para mostrar"
          description="Cuando Riot sincronice nuevas partidas, aparecerán aquí con sus métricas clave."
        />
      )}
    </AppShell>
  )
}
