import type { ReactNode } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TrendBadge } from "@/components/dashboard/trend-badge"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string
  helper?: string
  trend?: "up" | "down" | "flat"
  delta?: number
  icon?: ReactNode
  className?: string
}

export function MetricCard({ label, value, helper, trend, delta, icon, className }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] text-white backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">{label}</p>
        {icon}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
        <div className="flex items-center justify-between gap-2">
          {helper ? <p className="text-xs text-zinc-400">{helper}</p> : <span />}
          {trend ? <TrendBadge trend={trend} delta={delta} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}
