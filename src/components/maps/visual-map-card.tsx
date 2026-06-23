import Link from "next/link"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { summarizeMatches } from "@/analytics/entity-stats"
import { toSlug } from "@/lib/slug"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import type { MapBreakdown, MatchPerformance } from "@/types/domain"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-white">{value}</p>
    </div>
  )
}

export function VisualMapCard({
  map,
  matches,
  badge,
}: {
  map: MapBreakdown
  matches: MatchPerformance[]
  badge?: { label: string; best: boolean } | null
}) {
  const slug = toSlug(map.mapName || map.mapId || "map")
  const img = getMapAssets(map.mapName)
  const summary = summarizeMatches(matches)
  const bg = img.card ?? img.banner ?? map.mapImageUrl

  return (
    <Link
      href={`/maps/${slug}`}
      className="premium-card group relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#164e63)]" />
        <div
          className="map-hero-bg absolute inset-0 transition-transform duration-300 group-hover:scale-105"
          style={bg ? { backgroundImage: `url(${bg})` } : undefined}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.15)_40%,rgba(9,9,11,0.9))]" />
        {badge ? (
          <Badge
            className={
              badge.best
                ? "absolute right-3 top-3 border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                : "absolute right-3 top-3 border-rose-400/30 bg-rose-500/20 text-rose-100"
            }
          >
            {badge.best ? <Star className="mr-1 size-3" /> : null}
            {badge.label}
          </Badge>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-4 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          <p className="text-2xl font-extrabold text-white">{map.mapName}</p>
          <p className="mt-0.5 text-xs text-zinc-300">{map.matches} partidas</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        <Stat label="WR" value={`${map.winRate.toFixed(0)}%`} />
        <Stat label="KDA" value={map.kda.toFixed(2)} />
        <Stat label="ACS" value={map.avgAcs.toFixed(0)} />
        <Stat label="HS%" value={`${summary.hsPct.toFixed(0)}%`} />
      </div>
    </Link>
  )
}
