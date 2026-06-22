"use client"

import { MapThumbnail } from "./map-thumbnail"
import type { MatchPerformance } from "@/types/domain"

function computeWinrates(matches?: MatchPerformance[]) {
  if (!matches || matches.length === 0) return []

  const mapBuckets = new Map<string, { wins: number; total: number; imageUrl?: string }>()
  for (const m of matches) {
    const key = m.mapName || m.mapId || "unknown"
    const prev = mapBuckets.get(key) ?? { wins: 0, total: 0, imageUrl: m.mapImageUrl }
    prev.total += 1
    if (m.outcome === "win") prev.wins += 1
    if (!prev.imageUrl) prev.imageUrl = m.mapImageUrl
    mapBuckets.set(key, prev)
  }

  const arr = Array.from(mapBuckets.entries()).map(([name, data]) => ({ name, winrate: (data.wins / data.total) * 100, total: data.total, imageUrl: data.imageUrl }))
  arr.sort((a, b) => b.winrate - a.winrate)
  return arr
}

export function WinrateByMap({ matches }: { matches?: MatchPerformance[] }) {
  const rows = computeWinrates(matches)
  if (!rows.length) return null

  return (
    <div className="space-y-2">
      {rows.slice(0, 4).map((r) => (
        <div key={r.name} className="flex items-center gap-3">
          <div className="w-14">
            <MapThumbnail name={r.name} imageUrl={r.imageUrl} size="sm" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white">{r.name}</div>
              <div className="text-sm font-semibold text-white">{Math.round(r.winrate)}%</div>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-white/6">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, Math.round(r.winrate))}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
