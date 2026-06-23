import { TrendingDown, TrendingUp } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import type { AgentBreakdown, MapBreakdown } from "@/types/domain"

type QuickInsightsProps = {
  bestMap?: MapBreakdown | null
  worstMap?: MapBreakdown | null
  consistentAgent?: AgentBreakdown | null
  trend?: { acsDelta: number; available: boolean } | null
}

function Row({
  eyebrow,
  thumb,
  title,
  value,
  tone = "text-emerald-300",
}: {
  eyebrow: string
  thumb: React.ReactNode
  title: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="shrink-0">{thumb}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
        <p className="truncate text-sm font-semibold text-white">{title}</p>
      </div>
      <span className={`shrink-0 text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  )
}

export function QuickInsights({ bestMap, worstMap, consistentAgent, trend }: QuickInsightsProps) {
  const up = (trend?.acsDelta ?? 0) >= 0

  return (
    <div className="space-y-3">
      {bestMap ? (
        <Row
          eyebrow="Mejor mapa"
          thumb={<MapThumbnail name={bestMap.mapName} imageUrl={bestMap.mapImageUrl} iconUrl={bestMap.mapIconUrl} size="md" />}
          title={bestMap.mapName}
          value={`${bestMap.winRate.toFixed(0)}% Winrate`}
        />
      ) : null}
      {worstMap ? (
        <Row
          eyebrow="Peor mapa"
          thumb={<MapThumbnail name={worstMap.mapName} imageUrl={worstMap.mapImageUrl} iconUrl={worstMap.mapIconUrl} size="md" />}
          title={worstMap.mapName}
          value={`${worstMap.winRate.toFixed(0)}% Winrate`}
          tone="text-rose-400"
        />
      ) : null}
      {consistentAgent ? (
        <Row
          eyebrow="Agente más consistente"
          thumb={
            <AgentAvatar
              name={consistentAgent.agentName}
              imageUrl={consistentAgent.agentImageUrl}
              iconUrl={consistentAgent.agentIconUrl}
              size="md"
            />
          }
          title={consistentAgent.agentName}
          value={`${consistentAgent.winRate.toFixed(1)}% Winrate`}
        />
      ) : null}
      {trend?.available ? (
        <Row
          eyebrow="Tendencia reciente"
          thumb={
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/5">
              {up ? (
                <TrendingUp className="size-5 text-emerald-300" />
              ) : (
                <TrendingDown className="size-5 text-rose-400" />
              )}
            </div>
          }
          title={up ? "Rendimiento en alza" : "Rendimiento a la baja"}
          value={`${up ? "+" : ""}${trend.acsDelta.toFixed(1)} ACS`}
          tone={up ? "text-emerald-300" : "text-rose-400"}
        />
      ) : null}
    </div>
  )
}
