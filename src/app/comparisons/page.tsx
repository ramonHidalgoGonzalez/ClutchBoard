import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { ComparisonsView } from "@/components/comparisons/comparisons-view"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { buildActProgressionRows } from "@/server/valorant/analytics/act-progression"
import { listExternalActSummaries } from "@/server/repositories/external-act-summary-repository"
import { EmptyState } from "@/components/dashboard/empty-state"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function ComparisonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const scope = resolveScopeFromSearchParams(await searchParams)
  const { analytics, acts, syncedTotal, allMatches } = await getImprovementData(session?.puuid, scope)
  const matches = analytics.filteredMatches
  const agents = analytics.agentStats.map((a) => a.agentName).filter(Boolean)
  const maps = analytics.mapStats.map((m) => m.mapName).filter(Boolean)
  const externalActs = session ? await listExternalActSummaries(session.userId).catch(() => []) : []
  const actSources = buildActProgressionRows(allMatches, externalActs)
  const t = await getTranslations()

  return (
    <AppShell
      title={t("comparisons.title")}
      subtitle={t("comparisons.subtitle")}
      connected
      lastSyncedAt={new Date().toISOString()}
    >
      <div className="mb-5 flex justify-end">
        <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
      </div>
      {matches.length === 0 ? (
        <EmptyState
          title="No hay partidas sincronizadas para este acto"
          description="Cambia el filtro de acto o sincroniza más partidas para comparar."
        />
      ) : (
        <ComparisonsView
          matches={matches}
          allMatches={allMatches}
          agents={agents}
          maps={maps}
          acts={acts}
          actSources={actSources}
          now={new Date().getTime()}
        />
      )}
    </AppShell>
  )
}
