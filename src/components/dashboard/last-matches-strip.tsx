"use client"

import Link from "next/link"
import type { MatchPerformance } from "@/types/domain"

function outcomeMeta(outcome: MatchPerformance["outcome"]) {
  if (outcome === "win") {
    return { text: "W", tone: "text-emerald-300", edge: "border-l-emerald-400" }
  }
  if (outcome === "loss") {
    return { text: "L", tone: "text-rose-300", edge: "border-l-rose-400" }
  }
  return { text: "-", tone: "text-zinc-300", edge: "border-l-zinc-500" }
}

export function LastMatchesStrip({ matches }: { matches?: MatchPerformance[] }) {
  if (!matches || matches.length === 0) {
    return null
  }

  return (
    <div className="flex gap-2">
      {matches.map((m) => {
        const meta = outcomeMeta(m.outcome)
        return (
          <Link
            key={m.matchId}
            href={`/matches/${m.matchId}`}
            className={`relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 border-l-2 ${meta.edge}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={m.mapImageUrl ? { backgroundImage: `url(${m.mapImageUrl})` } : undefined}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.25),rgba(9,9,11,0.9))]" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col justify-between p-2">
              <span className={`text-lg font-extrabold leading-none ${meta.tone}`}>{meta.text}</span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {m.kills ?? "--"}-{m.deaths ?? "--"}
                </p>
                <p className="text-[11px] text-zinc-300">ACS {m.acsEstimate ?? "--"}</p>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
