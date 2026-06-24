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

  const scoped = analytics.filteredMatches
  const competitive = scoped.filter((m) => (m.queueId || m.queueName || "").toLowerCase().includes("competitive"))

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
      {scoped.length === 0 ? (
        <EmptyState
          title="No hay partidas sincronizadas para este acto"
          description="Sincroniza más partidas o selecciona otro acto."
        />
      ) : competitive.length === 0 ? (
        <EmptyState
          title="Sin partidas competitive en este acto"
          description="Hay partidas sincronizadas en este acto, pero no hay partidas competitive."
        />
      ) : (
        <RankedView matches={scoped} now={new Date().getTime()} rankLabel={rankLabel} />
      )}
    </AppShell>
  )
}
