import type { MapBreakdown } from "@/types/domain"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"

export function MapHeroCard({ map }: { map: MapBreakdown }) {
  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <MapThumbnail name={map.mapName} imageUrl={map.mapImageUrl} iconUrl={map.mapIconUrl} className="h-12 w-20" />
          <div>
            <p className="text-lg font-semibold">{map.mapName || "Unknown Map"}</p>
            <p className="text-xs text-zinc-400">{map.matches} partidas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <Metric label="WR" value={`${map.winRate.toFixed(1)}%`} />
          <Metric label="KDA" value={map.kda.toFixed(2)} />
          <Metric label="ACS" value={map.avgAcs.toFixed(0)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-zinc-100">sample {map.sampleLabel}</Badge>
          {(map.sampleSize ?? 0) < 4 ? <Badge className="bg-amber-500/20 text-amber-100">muestra pequena</Badge> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
