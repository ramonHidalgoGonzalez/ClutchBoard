import { Sparkline } from "@/components/stats/sparkline"
import { cn } from "@/lib/utils"

type StatPodProps = {
  label: string
  value: string
  delta?: number
  deltaSuffix?: string
  spark?: number[]
  sparkColor?: string
  className?: string
}

function formatDelta(delta: number, suffix?: string) {
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "■"
  const rounded = Math.abs(delta) >= 10 ? Math.round(Math.abs(delta)) : Math.abs(delta).toFixed(1)
  return `${arrow} ${rounded}${suffix ?? ""}`
}

/** Compact stat block: label, big value, and either a sparkline or a delta chip. */
export function StatPod({
  label,
  value,
  delta,
  deltaSuffix,
  spark,
  sparkColor = "#f43f5e",
  className,
}: StatPodProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta) && Math.abs(delta) > 0.05
  const deltaTone = (delta ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold text-white">{value}</p>
      {spark && spark.length >= 2 ? (
        <Sparkline values={spark} color={sparkColor} height={22} className="mt-1" />
      ) : hasDelta ? (
        <p className={cn("mt-1 text-xs font-semibold", deltaTone)}>
          {formatDelta(delta as number, deltaSuffix)}
        </p>
      ) : (
        <div className="mt-1 h-[22px]" aria-hidden="true" />
      )}
    </div>
  )
}
