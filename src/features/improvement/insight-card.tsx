import { Lightbulb, Target } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { Badge } from "@/components/ui/badge"
import type { ImprovementInsight } from "@/types/domain"

const PRIORITY = {
  high: { label: "Prioridad alta", chip: "border-rose-400/35 bg-rose-500/20 text-rose-100", bar: "bg-rose-500" },
  medium: { label: "Prioridad media", chip: "border-amber-400/35 bg-amber-500/20 text-amber-100", bar: "bg-amber-400" },
  low: { label: "Prioridad baja", chip: "border-emerald-400/35 bg-emerald-500/20 text-emerald-100", bar: "bg-emerald-400" },
} as const

export function InsightCard({ insight }: { insight: ImprovementInsight }) {
  const priority = PRIORITY[insight.priority]
  const isMap = insight.category === "map"
  const isAgent = insight.category === "agent"

  return (
    <article className="premium-card relative overflow-hidden p-5">
      <span className={`absolute inset-y-4 left-0 w-1 rounded-full ${priority.bar}`} />
      <div className="flex items-start gap-4 pl-2">
        <div className="shrink-0">
          {isMap ? (
            <MapThumbnail name={insight.entityName} imageUrl={insight.imageUrl} size="md" />
          ) : isAgent ? (
            <AgentAvatar name={insight.entityName} imageUrl={insight.imageUrl} size="lg" framing="bust" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-rose-500/15 text-rose-200">
              <Lightbulb className="size-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
            <div className="flex items-center gap-2">
              <Badge className={priority.chip}>{priority.label}</Badge>
              <Badge variant="outline" className="border-white/15 bg-white/5 text-zinc-300">
                {insight.confidence.toFixed(0)}% confianza
              </Badge>
            </div>
          </div>

          <p className="mt-2 text-sm text-zinc-300">{insight.description}</p>

          {insight.evidence.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.evidence.map((evidence) => (
                <Badge key={evidence.label} variant="outline" className="border-white/10 bg-black/25 text-zinc-200">
                  {evidence.label}: {evidence.value}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <Target className="mt-0.5 size-4 shrink-0" />
            <span>{insight.recommendation}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
