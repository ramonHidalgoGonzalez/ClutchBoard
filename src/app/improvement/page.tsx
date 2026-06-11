import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MetricCard } from "@/components/dashboard/metric-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { InsightCard } from "@/features/improvement/insight-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function ImprovementPage() {
  const session = await requireSession()
  const { insights, summary, matches } = await getImprovementData(session.puuid)
  const insufficientSample = matches.length < 8

  return (
    <AppShell title="Improvement" subtitle="Coach mode explicable" connected lastSyncedAt={new Date().toISOString()}>
      <div className="space-y-6">
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
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
