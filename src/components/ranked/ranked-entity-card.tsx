import { Trophy } from "lucide-react"

import { RankBadge } from "@/components/ranked/rank-badge"
import type { RankedOverview } from "@/server/valorant/analytics/ranked"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
    </div>
  )
}

export function RankedEntityCard({
  title,
  overview,
  splitNoun,
  bestName,
  worstName,
}: {
  title: string
  overview: RankedOverview
  splitNoun: string
  bestName?: string | null
  worstName?: string | null
}) {
  if (overview.rankedMatches === 0) return null

  return (
    <div className="premium-card p-5">
      <p className="mb-4 flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">
        <Trophy className="size-4 text-amber-300" /> {title}
      </p>
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-3">
          <RankBadge tierId={overview.currentTierId} size={56} />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Último tier</p>
            <p className="text-lg font-extrabold text-violet-200">{overview.currentTierName ?? "—"}</p>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-4 gap-3">
          <Stat label="Partidas" value={String(overview.rankedMatches)} />
          <Stat label="Winrate" value={overview.winrate === null ? "—" : `${overview.winrate.toFixed(0)}%`} />
          <Stat label="K/D" value={overview.averageKd === null ? "—" : overview.averageKd.toFixed(2)} />
          <Stat label="ACS" value={overview.averageAcs === null ? "—" : overview.averageAcs.toFixed(0)} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
        <p className="text-zinc-400">
          Mejor {splitNoun}: <span className="font-semibold text-emerald-300">{bestName ?? "—"}</span>
        </p>
        <p className="text-right text-zinc-400">
          Peor {splitNoun}: <span className="font-semibold text-rose-300">{worstName ?? "—"}</span>
        </p>
      </div>
    </div>
  )
}
