import { AppShell } from "@/components/app-shell"
import { InsightCard } from "@/features/improvement/insight-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function ImprovementPage() {
  await requireSession()
  const { insights, summary } = await getImprovementData()

  return (
    <AppShell title="Improvement" subtitle="Coach mode explicable">
      <div className="space-y-6">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4 text-sm text-zinc-300">
            <p>Momentum: {summary.momentum.toFixed(1)}</p>
            <p>Fatiga: {summary.fatigueScore.toFixed(1)}</p>
            <p>Estabilidad: {summary.stabilityScore.toFixed(1)}</p>
            <p>Score mejora: {summary.improvementScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <div className="grid gap-4 xl:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
