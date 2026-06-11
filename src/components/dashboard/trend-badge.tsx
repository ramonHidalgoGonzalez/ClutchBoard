import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TrendBadgeProps = {
  trend?: "up" | "down" | "flat"
  delta?: number
  className?: string
}

export function TrendBadge({ trend, delta, className }: TrendBadgeProps) {
  const icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus
  const colorClass =
    trend === "up"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
      : trend === "down"
        ? "border-rose-400/30 bg-rose-500/15 text-rose-200"
        : "border-zinc-400/30 bg-zinc-500/15 text-zinc-200"

  const Icon = icon

  return (
    <Badge variant="outline" className={cn("gap-1.5", colorClass, className)}>
      <Icon className="size-3" />
      {typeof delta === "number" ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}` : "stable"}
    </Badge>
  )
}
