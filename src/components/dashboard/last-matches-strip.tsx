"use client"

import Link from "next/link"
import { MapThumbnail } from "./map-thumbnail"
import type { MatchPerformance } from "@/types/domain"

export function LastMatchesStrip({ matches }: { matches?: MatchPerformance[] }) {
  if (!matches || matches.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      {matches.map((m) => (
        <Link
          key={m.matchId}
          href={`/matches/${m.matchId}`}
          className="relative w-36 shrink-0 overflow-hidden rounded-xl border border-white/6 bg-black/20 p-2 text-xs text-zinc-200"
        >
          <div className="relative h-20 w-full overflow-hidden rounded-md bg-black/10">
            <MapThumbnail name={m.mapName || m.mapId} imageUrl={m.mapImageUrl} size="sm" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{m.outcome === "win" ? "W" : m.outcome === "loss" ? "L" : "-"}</div>
              <div className="text-[11px] text-zinc-300">ACS {m.acsEstimate ?? "--"}</div>
            </div>
            <div className="text-right text-[11px] text-zinc-400">{m.kills ?? "--"}-{m.deaths ?? "--"}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
