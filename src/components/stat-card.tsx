import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KpiMetric } from "@/types/domain"

export function StatCard({ metric }: { metric: KpiMetric }) {
  const trendIcon =
    metric.trend === "up" ? (
      <ArrowUpRight className="size-4 text-emerald-300" />
    ) : metric.trend === "down" ? (
      <ArrowDownRight className="size-4 text-rose-300" />
    ) : (
      <Minus className="size-4 text-zinc-400" />
    )

  return (
    <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300">{metric.label}</CardTitle>
        {trendIcon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{metric.displayValue}</div>
        <div className="mt-3 flex items-center gap-2">
          {typeof metric.delta === "number" ? (
            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-200">
              {metric.delta >= 0 ? "+" : ""}
              {metric.delta.toFixed(1)}
            </Badge>
          ) : null}
          <span className="text-xs text-zinc-500">{metric.source === "derived-app" ? "Derivado" : "Oficial"}</span>
        </div>
      </CardContent>
    </Card>
  )
}
