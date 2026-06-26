import Link from "next/link"
import { Sparkles, TrendingUp } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { Card, CardContent } from "@/components/ui/card"
import type { TFunction } from "@/i18n/translate"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import type { Strengths } from "@/server/valorant/analytics/improvement-insights"
import { formatDelta } from "./localize"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
        {children}
      </div>
    </div>
  )
}

export function StrengthsCard({ t, strengths }: { t: TFunction; strengths: Strengths }) {
  const empty = !strengths.bestAgent && !strengths.bestMap && !strengths.mostImprovedMetric && !strengths.bestCombo
  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
          <Sparkles className="size-4 text-amber-300" /> {t("improvement.strengthsTitle")}
        </h2>

        {empty ? (
          <p className="text-sm text-zinc-500">{t("improvement.strengthsEmpty")}</p>
        ) : (
          <div className="space-y-2.5">
            {strengths.bestAgent ? (
              <Row label={t("improvement.bestAgent")}>
                <Link href={`/agents/${strengths.bestAgent.slug}`} className="flex items-center gap-3">
                  <AgentAvatar
                    name={strengths.bestAgent.name}
                    imageUrl={getAgentAssets(strengths.bestAgent.name).table}
                    size="sm"
                    framing="avatar"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{strengths.bestAgent.name}</span>
                    <span className="block text-xs text-zinc-500">{t("improvement.nMatches", { n: strengths.bestAgent.matches })}</span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">{strengths.bestAgent.winRate}%</span>
                </Link>
              </Row>
            ) : null}

            {strengths.bestMap ? (
              <Row label={t("improvement.bestMap")}>
                <Link href={`/maps/${strengths.bestMap.slug}`} className="flex items-center gap-3">
                  <MapThumbnail name={strengths.bestMap.name} imageUrl={getMapAssets(strengths.bestMap.name).thumb} className="h-10 w-16" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{strengths.bestMap.name}</span>
                    <span className="block text-xs text-zinc-500">{t("improvement.nMatches", { n: strengths.bestMap.matches })}</span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">{strengths.bestMap.winRate}%</span>
                </Link>
              </Row>
            ) : null}

            {strengths.mostImprovedMetric ? (
              <Row label={t("improvement.mostImproved")}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-emerald-300" />
                  <span className="text-sm font-semibold text-white">{t(`improvement.metric.${strengths.mostImprovedMetric.metricKey}`)}</span>
                  <span className="text-sm font-semibold text-emerald-300">{formatDelta(strengths.mostImprovedMetric.delta, 2)}</span>
                </div>
              </Row>
            ) : null}

            {strengths.bestCombo ? (
              <Row label={t("improvement.bestCombo")}>
                <p className="text-sm font-semibold text-white">
                  {strengths.bestCombo.agentName} · {strengths.bestCombo.mapName}
                  <span className="ml-2 text-emerald-300">{strengths.bestCombo.winRate}%</span>
                </p>
              </Row>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
