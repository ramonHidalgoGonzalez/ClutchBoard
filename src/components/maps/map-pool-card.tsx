import Link from "next/link"
import { ChevronRight, Star } from "lucide-react"

import { MatchResultTiles } from "@/components/matches/match-result-tiles"
import { Sparkline } from "@/components/stats/sparkline"
import { StatPod } from "@/components/stats/stat-pod"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  acsPercentile,
  acsSeries,
  lastN,
  splitDelta,
  summarizeMatches,
} from "@/analytics/entity-stats"
import { toSlug } from "@/lib/slug"
import type { MapBreakdown, MatchPerformance } from "@/types/domain"

export function MapPoolCard({
  map,
  matches,
  allMatches,
  isBest = false,
}: {
  map: MapBreakdown
  matches: MatchPerformance[]
  allMatches: MatchPerformance[]
  isBest?: boolean
}) {
  const summary = summarizeMatches(matches)
  const delta = splitDelta(matches)
  const percentile = acsPercentile(matches, allMatches)
  const slug = toSlug(map.mapName || map.mapId || "map")

  return (
    <Card className="glass-panel overflow-hidden text-white">
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* Splash */}
          <Link
            href={`/maps/${slug}`}
            className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#164e63)]" />
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={map.mapImageUrl ? { backgroundImage: `url(${map.mapImageUrl})` } : undefined}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(9,9,11,0.9))]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-2xl font-extrabold leading-none">{map.mapName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/70">Mapa</p>
            </div>
          </Link>

          {/* Stats */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <Link href={`/maps/${slug}`} className="text-xl font-semibold hover:text-cyan-200">
                {map.mapName}
              </Link>
              {isBest ? (
                <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                  <Star className="mr-1 size-3.5" /> Mejor mapa
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              <StatPod label="Partidas" value={String(summary.games)} />
              <StatPod
                label="Winrate"
                value={`${summary.winRate.toFixed(0)}%`}
                delta={delta.available ? delta.winRate : undefined}
                deltaSuffix="%"
              />
              <StatPod label="K/D" value={summary.kd.toFixed(2)} delta={delta.available ? delta.kd : undefined} />
              <StatPod label="ACS" value={summary.avgAcs.toFixed(0)} delta={delta.available ? delta.acs : undefined} />
              <StatPod label="HS%" value={`${summary.hsPct.toFixed(1)}%`} />
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-6">
              <StatPod label="Victorias" value={String(summary.wins)} />
              <StatPod label="Derrotas" value={String(summary.losses)} />
              <StatPod label="Kills / R" value={summary.killsPerRound.toFixed(2)} />
              <StatPod label="Deaths / R" value={summary.deathsPerRound.toFixed(2)} />
              <StatPod label="Assists / R" value={summary.assistsPerRound.toFixed(2)} />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-400">ACS prom.</p>
                <p className="mt-1 truncate text-2xl font-bold text-white">{summary.avgAcs.toFixed(0)}</p>
                <Sparkline values={acsSeries(matches)} color="#f59e0b" height={22} className="mt-1" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-zinc-300">
            Últimas 5 partidas en {map.mapName}
          </h4>
          <MatchResultTiles matches={lastN(matches, 5)} background="map" />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
          <span className="text-zinc-400">
            {percentile !== null ? (
              <>
                Rendimiento en el percentil <span className="font-semibold text-emerald-300">{percentile}</span>
              </>
            ) : (
              "Muestra pequeña"
            )}
          </span>
          <Link
            href={`/maps/${slug}`}
            className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200"
          >
            Ver todas las partidas en {map.mapName} <ChevronRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
