import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MatchHistory } from "@/components/matches/match-history"
import { AutoSync } from "@/components/sync/auto-sync"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const scope = resolveScopeFromSearchParams(await searchParams)
  const { analytics, acts, syncedTotal } = await getImprovementData(session?.puuid, scope)
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
      <AutoSync />
      <div className="mb-5 flex justify-end">
        <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
      </div>
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
          title="No hay partidas sincronizadas para este acto"
          description="Clutchboard solo puede analizar partidas que Riot devuelva en el matchlist disponible o que la app haya guardado previamente. Si jugaste en este acto pero aparece vacío, probablemente esas partidas no estaban sincronizadas todavía."
        />
      )}
    </AppShell>
  )
}
