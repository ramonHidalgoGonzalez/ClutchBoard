import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ImprovementInsight } from "@/types/domain"

export function InsightCard({ insight }: { insight: ImprovementInsight }) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{insight.title}</CardTitle>
          <Badge className="bg-white/10 text-zinc-100">{insight.priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-300">{insight.description}</p>
        <div className="flex flex-wrap gap-2">
          {insight.evidence.map((evidence) => (
            <Badge key={evidence.label} variant="outline" className="border-white/10 bg-black/20 text-zinc-200">
              {evidence.label}: {evidence.value}
            </Badge>
          ))}
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {insight.recommendation}
        </div>
      </CardContent>
    </Card>
  )
}
