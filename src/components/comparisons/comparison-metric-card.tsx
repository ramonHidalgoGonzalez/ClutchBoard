import { Minus, TrendingDown, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatMetricValue, type ComparisonMetric } from "@/server/valorant/analytics/comparisons"

function signed(value: number, format: ComparisonMetric["format"]) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  return `${sign}${formatMetricValue(Math.abs(value), format)}`
}

export function ComparisonDeltaBadge({ metric }: { metric: ComparisonMetric }) {
  if (metric.delta === null) {
    return <span className="text-xs text-zinc-500">—</span>
  }
  const tone =
    metric.isPositive === true
      ? "text-emerald-400"
      : metric.isPositive === false
        ? "text-rose-400"
        : "text-zinc-400"
  const Icon = metric.direction === "up" ? TrendingUp : metric.direction === "down" ? TrendingDown : Minus
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", tone)}>
      <Icon className="size-3.5" />
      {signed(metric.delta, metric.format)}
    </span>
  )
}

export function ComparisonMetricCard({
  metric,
  currentLabel = "Actual",
  previousLabel = "Anterior",
}: {
  metric: ComparisonMetric
  currentLabel?: string
  previousLabel?: string
}) {
  const accent =
    metric.isPositive === true
      ? "from-emerald-500/15"
      : metric.isPositive === false
        ? "from-rose-500/15"
        : "from-white/5"

  return (
    <div className="premium-card relative overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-b to-transparent opacity-60 blur-2xl", accent)} />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">{metric.label}</p>
        <p className="mt-2 text-3xl font-extrabold text-white">{formatMetricValue(metric.current, metric.format)}</p>
        <div className="mt-2 flex items-center gap-2">
          <ComparisonDeltaBadge metric={metric} />
          <span className="text-xs text-zinc-500">vs {previousLabel.toLowerCase()}</span>
        </div>
        <p className="mt-3 border-t border-white/10 pt-2 text-xs text-zinc-500">
          {currentLabel}: <span className="text-zinc-300">{formatMetricValue(metric.current, metric.format)}</span>
          <span className="mx-1.5 text-zinc-600">·</span>
          {previousLabel}: <span className="text-zinc-300">{formatMetricValue(metric.previous, metric.format)}</span>
        </p>
      </div>
    </div>
  )
}
