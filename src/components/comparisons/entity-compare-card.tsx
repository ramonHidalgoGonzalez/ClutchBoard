import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import type { EntitySide } from "@/server/valorant/analytics/comparisons"

function fmt(value: number | null, kind: "pct" | "ratio" | "int") {
  if (value === null || !Number.isFinite(value)) return "—"
  if (kind === "pct") return `${value.toFixed(0)}%`
  if (kind === "ratio") return value.toFixed(2)
  return Math.round(value).toString()
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
    </div>
  )
}

export function EntityCompareCard({ kind, side }: { kind: "agent" | "map"; side: EntitySide }) {
  const agg = side.aggregate
  const heroImg = kind === "agent" ? getAgentAssets(side.name).hero : null
  const bannerImg = kind === "map" ? (getMapAssets(side.name).banner ?? getMapAssets(side.name).card) : null

  return (
    <div className="premium-card flex flex-col overflow-hidden">
      <div className="relative h-44 overflow-hidden">
        {kind === "agent" ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fb718533,transparent_55%),linear-gradient(160deg,#1e293b,#0b1020)]" />
            {heroImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImg}
                alt={side.name}
                className="agent-hero-image absolute inset-x-0 bottom-0 mx-auto h-[120%] object-contain object-bottom"
              />
            ) : null}
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#164e63)]" />
            <div
              className="map-hero-bg absolute inset-0"
              style={bannerImg ? { backgroundImage: `url(${bannerImg})` } : undefined}
              aria-hidden="true"
            />
          </>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(9,9,11,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 p-4 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          <p className="text-2xl font-extrabold text-white">{side.name}</p>
          <p className="text-xs text-zinc-300">{agg.games} partidas</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        <Stat label="WR" value={fmt(agg.winRate, "pct")} />
        <Stat label="KDA" value={fmt(agg.kda, "ratio")} />
        <Stat label="ACS" value={fmt(agg.avgAcs, "int")} />
        <Stat label="HS%" value={agg.hsPct === null ? "—" : `${agg.hsPct.toFixed(1)}%`} />
      </div>

      <div className="space-y-1 border-t border-white/10 px-4 py-3 text-xs">
        <p className="text-zinc-400">
          {kind === "agent" ? "Mejor mapa" : "Mejor agente"}:{" "}
          <span className="font-semibold text-emerald-300">
            {side.bestSplit ? `${side.bestSplit.name} (${side.bestSplit.winRate.toFixed(0)}%)` : "—"}
          </span>
        </p>
        <p className="text-zinc-400">
          {kind === "agent" ? "Peor mapa" : "Peor agente"}:{" "}
          <span className="font-semibold text-rose-300">
            {side.worstSplit ? `${side.worstSplit.name} (${side.worstSplit.winRate.toFixed(0)}%)` : "—"}
          </span>
        </p>
      </div>
    </div>
  )
}
