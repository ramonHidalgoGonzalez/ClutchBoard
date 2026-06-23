import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MetricCard } from "@/components/dashboard/metric-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { InsightCard } from "@/features/improvement/insight-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function ImprovementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await requireSession()
  const scope = resolveScopeFromSearchParams(await searchParams)
  const { insights, summary, matches, acts, syncedTotal } = await getImprovementData(session.puuid, scope)
  const insufficientSample = matches.length < 8
  const t = await getTranslations()

  return (
    <AppShell title={t("improvement.title")} subtitle={t("improvement.subtitle")} connected lastSyncedAt={new Date().toISOString()}>
      <div className="space-y-6">
        <div className="flex justify-end">
          <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
        </div>
        <SectionHeader
          title="Areas de mejora"
          description="Recomendaciones post-match basadas en tu muestra reciente."
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Momentum" value={summary.momentum.toFixed(1)} helper="Ultimas partidas" />
          <MetricCard label="Fatiga" value={summary.fatigueScore.toFixed(1)} helper="Sesiones largas" />
          <MetricCard label="Estabilidad" value={summary.stabilityScore.toFixed(1)} helper="Consistencia" />
          <MetricCard label="Score mejora" value={summary.improvementScore.toFixed(1)} helper="Potencial estimado" />
        </section>

        <Card className="glass-panel text-white">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-300">
            <p>
              Insights basados en {matches.length} partidas analizadas. Se priorizan patrones con evidencia suficiente y se evita
              inferir conclusiones sin muestra.
            </p>
          </CardContent>
        </Card>

        {insufficientSample ? (
          <EmptyState
            title="Necesitamos mas partidas para generar recomendaciones fiables."
            description="Cuando la muestra sea mayor, el coach mostrara insights con mas confianza y prioridad mejor calibrada."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.id} className="space-y-2">
                {insight.category === "map" ? (
                  <MapThumbnail name={insight.entityName} imageUrl={insight.imageUrl} className="h-14 w-28" />
                ) : insight.category === "agent" ? (
                  <AgentAvatar name={insight.entityName} imageUrl={insight.imageUrl} size="lg" />
                ) : null}
                <InsightCard insight={insight} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
