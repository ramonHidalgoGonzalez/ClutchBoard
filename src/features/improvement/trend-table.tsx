import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TFunction } from "@/i18n/translate"
import type { ImprovementTrend } from "@/server/valorant/analytics/improvement-insights"

import { formatDelta, trendArrow, trendToneClass } from "./localize"

function fmt(metricKey: string, value: number) {
  if (metricKey === "kd") return value.toFixed(2)
  if (metricKey === "winrate") return `${value}%`
  return String(value)
}

export function TrendTable({ t, trend }: { t: TFunction; trend: ImprovementTrend }) {
  if (!trend.available) {
    return (
      <Card className="glass-panel text-white">
        <CardContent className="space-y-2 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("improvement.trendTitle")}</h2>
          <p className="text-sm text-zinc-500">{t("improvement.trendUnavailable")}</p>
        </CardContent>
      </Card>
    )
  }

  const currentLabel = trend.kind === "act" ? t("improvement.trend.currentAct") : t("improvement.trend.recent")
  const previousLabel = trend.kind === "act" ? t("improvement.trend.previousAct") : t("improvement.trend.older")

  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("improvement.trendTitle")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-zinc-500">
                <th className="pb-2 text-left font-medium">{t("improvement.col.metric")}</th>
                <th className="pb-2 text-center font-medium">{currentLabel}</th>
                <th className="pb-2 text-center font-medium">{previousLabel}</th>
                <th className="pb-2 text-right font-medium">{t("improvement.col.change")}</th>
              </tr>
            </thead>
            <tbody>
              {trend.metrics.map((m) => (
                <tr key={m.metricKey} className="border-t border-white/5">
                  <td className="py-2.5 text-left text-zinc-300">{t(`improvement.metric.${m.metricKey}`)}</td>
                  <td className="text-center font-semibold text-white">{fmt(m.metricKey, m.current)}</td>
                  <td className="text-center text-zinc-400">{fmt(m.metricKey, m.previous)}</td>
                  <td className={cn("text-right font-semibold", trendToneClass(m.direction))}>
                    {formatDelta(m.delta, m.metricKey === "kd" ? 2 : 0)} {trendArrow(m.direction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
