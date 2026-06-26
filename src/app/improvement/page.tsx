import { Info } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { EmptyState } from "@/components/dashboard/empty-state"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"
import { PriorityCards } from "@/features/improvement/priority-cards"
import { TrainThisWeek } from "@/features/improvement/train-week"
import { StrengthsCard } from "@/features/improvement/strengths-card"
import { TrendTable } from "@/features/improvement/trend-table"
import { MapProblems } from "@/features/improvement/map-problems"
import { AgentProblems } from "@/features/improvement/agent-problems"

export default async function ImprovementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await requireSession()
  const scope = resolveScopeFromSearchParams(await searchParams)
  const { improvement, acts, syncedTotal } = await getImprovementData(session.puuid, scope)
  const t = await getTranslations()

  const { sufficient, minSample, sampleSize, priorities, trainingTasks, strengths, trend, mapProblems, agentProblems } = improvement

  return (
    <AppShell title={t("improvement.title")} subtitle={t("improvement.subtitle")} connected lastSyncedAt={new Date().toISOString()}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
        </div>

        {sufficient ? (
          <PriorityCards t={t} priorities={priorities} />
        ) : (
          <EmptyState
            title={t("improvement.emptyTitle", { n: minSample })}
            description={t("improvement.emptyDesc", { n: minSample, count: sampleSize })}
          />
        )}

        <TrainThisWeek t={t} tasks={trainingTasks} />

        <div className="grid gap-6 xl:grid-cols-2">
          <StrengthsCard t={t} strengths={strengths} />
          <TrendTable t={t} trend={trend} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <MapProblems t={t} rows={mapProblems} />
          <AgentProblems t={t} rows={agentProblems} />
        </div>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <Info className="size-3.5" />
          {t("improvement.basedOn", { n: sampleSize })}
        </p>
      </div>
    </AppShell>
  )
}
