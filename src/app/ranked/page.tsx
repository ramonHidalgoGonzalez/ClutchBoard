import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { RankedView } from "@/components/ranked/ranked-view"
import { EmptyState } from "@/components/dashboard/empty-state"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function RankedPage({
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
  const t = await getTranslations()

  // Don't call an old act's rank "current rank".
  const rankLabel =
    scope.type === "current_act"
      ? "Rango actual detectado"
      : scope.type === "all"
        ? "Último rango detectado"
        : "Rango detectado en este periodo"

  return (
    <AppShell
      title={t("ranked.title")}
      subtitle={t("ranked.subtitle")}
      connected
      lastSyncedAt={new Date().toISOString()}
    >
      <div className="mb-5 flex justify-end">
        <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
      </div>
      {analytics.filteredMatches.length === 0 ? (
        <EmptyState
          title="No se han detectado actos en estas partidas"
          description="No hay partidas sincronizadas para este filtro. Cambia de acto o sincroniza más partidas."
        />
      ) : (
        <RankedView matches={analytics.filteredMatches} now={new Date().getTime()} rankLabel={rankLabel} />
      )}
    </AppShell>
  )
}
