import Link from "next/link"
import { ArrowLeft, ChevronRight, Clock, Star } from "lucide-react"

import { AcsTrendChart, type TrendDatum } from "@/components/stats/acs-trend-chart"
import { MatchResultTiles } from "@/components/matches/match-result-tiles"
import { StatPod } from "@/components/stats/stat-pod"
import { WinrateBars } from "@/components/stats/winrate-bars"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  acsPercentile,
  chronological,
  formatPlaytime,
  lastN,
  splitDelta,
  summarizeMatches,
  type WinrateRow,
} from "@/analytics/entity-stats"
import type { MatchPerformance } from "@/types/domain"

type EntityDetailProps = {
  kind: "agent" | "map"
  name: string
  imageUrl?: string | null
  subtitle: string
  matches: MatchPerformance[]
  allMatches: MatchPerformance[]
  breakdownTitle: string
  breakdownRows: WinrateRow[]
  breakdownKind: "agent" | "map"
  highlight?: { label: string } | null
  backHref: string
  backLabel: string
  ranked?: React.ReactNode
}

function trendData(matches: MatchPerformance[]): TrendDatum[] {
  return chronological(matches).map((m, index) => ({
    label: new Date(m.startedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" }) || `#${index + 1}`,
    acs: Math.round(m.acsEstimate ?? 0),
  }))
}

export function EntityDetail({
  kind,
  name,
  imageUrl,
  subtitle,
  matches,
  allMatches,
  breakdownTitle,
  breakdownRows,
  breakdownKind,
  highlight,
  backHref,
  backLabel,
  ranked,
}: EntityDetailProps) {
  const summary = summarizeMatches(matches)
  const delta = splitDelta(matches)
  const percentile = acsPercentile(matches, allMatches)
  const heroAspect = kind === "agent" ? "aspect-[3/4]" : "aspect-[16/10]"
  // Agent portraits are near-square full-body cutouts → cover the tall panel
  // anchored at the head so the character reads large (legs may crop, like the
  // reference). Map splashes are landscape → cover centered.
  const heroBgClass =
    kind === "agent"
      ? "absolute inset-0 bg-cover bg-top"
      : "absolute inset-0 bg-cover bg-center"

  return (
    <div className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      {/* Hero + headline stats */}
      <Card className="glass-panel overflow-hidden text-white">
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[300px_1fr]">
          <div className={`relative ${heroAspect} overflow-hidden rounded-2xl border border-white/10`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fb718555,transparent_60%),linear-gradient(135deg,#0f172a,#1e1b4b)]" />
            <div
              className={heroBgClass}
              style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(9,9,11,0.92))]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-3xl font-extrabold leading-none">{name}</p>
              <p className="mt-1 text-sm text-zinc-300">{subtitle}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-rose-200/70">
                  {kind === "agent" ? "Perfil de agente" : "Perfil de mapa"}
                </p>
                <p className="text-xl font-semibold">{name}</p>
              </div>
              {highlight ? (
                <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                  <Star className="mr-1 size-3.5" /> {highlight.label}
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-5">
              <StatPod label="Partidas" value={String(summary.games)} />
              <StatPod
                label="Winrate"
                value={`${summary.winRate.toFixed(1)}%`}
                delta={delta.available ? delta.winRate : undefined}
                deltaSuffix="%"
              />
              <StatPod
                label="K/D"
                value={summary.kd.toFixed(2)}
                delta={delta.available ? delta.kd : undefined}
              />
              <StatPod
                label="ACS"
                value={summary.avgAcs.toFixed(0)}
                delta={delta.available ? delta.acs : undefined}
              />
              <StatPod
                label="HS%"
                value={`${summary.hsPct.toFixed(1)}%`}
                delta={delta.available ? delta.hsPct : undefined}
                deltaSuffix="%"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {ranked}

      {/* Time + breakdown + combat detail */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="glass-panel text-white">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">Tiempo jugado</p>
                <p className="mt-1 text-2xl font-bold">{formatPlaytime(summary.playtimeSeconds)}</p>
              </div>
              <Clock className="size-8 text-rose-300/70" />
            </div>
            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-sm font-semibold text-zinc-300">{breakdownTitle}</p>
              <WinrateBars rows={breakdownRows} kind={breakdownKind} limit={4} showCount />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel text-white">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-semibold text-zinc-300">Desglose de combate</p>
            <div className="grid grid-cols-2 gap-3">
              <StatPod label="Victorias" value={String(summary.wins)} />
              <StatPod label="Derrotas" value={String(summary.losses)} />
              <StatPod label="Kills / R" value={summary.killsPerRound.toFixed(2)} />
              <StatPod label="Deaths / R" value={summary.deathsPerRound.toFixed(2)} />
              <StatPod label="Assists / R" value={summary.assistsPerRound.toFixed(2)} />
              <StatPod label="KDA" value={summary.kda.toFixed(2)} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel text-white">
          <CardContent className="space-y-4 p-5">
            <p className="text-sm font-semibold text-zinc-300">Precisión e impacto</p>
            <div className="grid grid-cols-2 gap-3">
              <StatPod
                label="HS%"
                value={`${summary.hsPct.toFixed(1)}%`}
                delta={delta.available ? delta.hsPct : undefined}
                deltaSuffix="%"
              />
              <StatPod label="First Bloods" value={String(summary.firstBloods)} />
            </div>
            {percentile !== null ? (
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                Rendimiento en el percentil{" "}
                <span className="font-semibold text-emerald-300">{percentile}</span> de tus partidas.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card className="glass-panel text-white">
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-semibold text-zinc-300">Tendencia de rendimiento (ACS)</p>
          {matches.length >= 2 ? (
            <AcsTrendChart data={trendData(matches)} />
          ) : (
            <p className="text-sm text-zinc-500">Necesitas más partidas para una tendencia fiable.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent matches */}
      <Card className="glass-panel text-white">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-300">Últimas 5 partidas</p>
            <Link
              href="/matches"
              className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
            >
              Ver historial <ChevronRight className="size-3" />
            </Link>
          </div>
          <MatchResultTiles matches={lastN(matches, 5)} background={kind} />
        </CardContent>
      </Card>
    </div>
  )
}
