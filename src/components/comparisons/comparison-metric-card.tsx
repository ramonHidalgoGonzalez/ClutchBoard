import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMetricValue, type ComparisonMetric } from "@/server/valorant/analytics/comparisons"

const GAUGE: Record<string, { color: string; max: number }> = {
  winRate: { color: "#34d399", max: 100 },
  hs: { color: "#fbbf24", max: 50 },
  kda: { color: "#a855f7", max: 2.5 },
  acs: { color: "#22d3ee", max: 350 },
  kills: { color: "#fb7185", max: 1.2 },
  deaths: { color: "#fb7185", max: 1.2 },
  assists: { color: "#38bdf8", max: 0.8 },
  duration: { color: "#60a5fa", max: 2700 },
}

function MiniGauge({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value))
  const r = 15
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  )
}

export function ComparisonDeltaBadge({ metric }: { metric: ComparisonMetric }) {
  if (metric.delta === null) return <span className="text-xs text-zinc-500">—</span>
  const tone =
    metric.isPositive === true ? "text-emerald-400" : metric.isPositive === false ? "text-rose-400" : "text-zinc-400"
  const Icon = metric.direction === "up" ? TrendingUp : metric.direction === "down" ? TrendingDown : TrendingUp
  const sign = metric.delta > 0 ? "+" : metric.delta < 0 ? "−" : ""
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", tone)}>
      <Icon className="size-3.5" />
      {sign}
      {formatMetricValue(Math.abs(metric.delta), metric.format)}
    </span>
  )
}

export function ComparisonMetricCard({ metric }: { metric: ComparisonMetric }) {
  const gauge = GAUGE[metric.key] ?? { color: "#a1a1aa", max: 100 }
  const gaugePct = metric.current !== null ? (metric.current / gauge.max) * 100 : 0
  const valueTone =
    metric.isPositive === true ? "text-emerald-400" : metric.isPositive === false ? "text-rose-400" : "text-white"
  const word = metric.isPositive === true ? "Mejora" : metric.isPositive === false ? "Empeora" : null

  return (
    <div className="premium-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">{metric.label}</p>
        <ChevronRight className="size-4 text-zinc-600" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={cn("text-3xl font-extrabold", valueTone)}>{formatMetricValue(metric.current, metric.format)}</p>
        <p className="text-xl font-semibold text-zinc-500">{formatMetricValue(metric.previous, metric.format)}</p>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="leading-tight">
          <ComparisonDeltaBadge metric={metric} />
          {word ? (
            <p className={cn("text-[11px]", metric.isPositive ? "text-emerald-400/80" : "text-rose-400/80")}>{word}</p>
          ) : null}
        </div>
        <MiniGauge value={gaugePct} color={gauge.color} />
      </div>
    </div>
  )
}
