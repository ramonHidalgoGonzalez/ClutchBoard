import type { MapBreakdown } from "@/types/domain"

import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cleanMapName } from "@/lib/valorant-content"

export function MapHeroCard({ map }: { map: MapBreakdown }) {
  const label = cleanMapName(map.mapName || "Unknown Map")

  return (
    <Card className="glass-panel overflow-hidden text-white">
      <CardContent className="relative py-0">
        <div className="absolute inset-x-0 top-0 h-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={map.mapImageUrl ? { backgroundImage: `url(${map.mapImageUrl})` } : undefined}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.12),rgba(12,10,9,0.82))]" />
        </div>

        <div className="relative flex items-center gap-4 px-5 pb-4 pt-6">
          <MapThumbnail name={label} imageUrl={map.mapImageUrl} iconUrl={map.mapIconUrl} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">Map profile</p>
            <p className="truncate text-xl font-semibold">{label}</p>
            <p className="text-xs text-zinc-300">{map.matches} partidas registradas</p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-2 px-5 pb-4 text-sm">
          <Metric label="WR" value={`${map.winRate.toFixed(1)}%`} />
          <Metric label="KDA" value={map.kda.toFixed(2)} />
          <Metric label="ACS" value={map.avgAcs.toFixed(0)} />
        </div>

        <div className="relative flex flex-wrap gap-2 px-5 pb-5">
          <Badge className="bg-white/10 text-zinc-100">sample {map.sampleLabel}</Badge>
          {(map.sampleSize ?? 0) < 4 ? <Badge className="bg-amber-500/20 text-amber-100">muestra pequena</Badge> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
