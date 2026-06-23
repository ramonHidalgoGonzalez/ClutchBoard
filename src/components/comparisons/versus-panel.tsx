import Link from "next/link"
import type { ReactNode } from "react"

import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import { toSlug } from "@/lib/slug"
import type { EntitySide } from "@/server/valorant/analytics/comparisons"

const HEX = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)"

function Hexagon() {
  return (
    <div className="relative size-12 shrink-0">
      <div className="absolute inset-0 bg-rose-500/80" style={{ clipPath: HEX }} />
      <div className="absolute inset-[2px] bg-[#0b0e16]" style={{ clipPath: HEX }} />
      <span className="absolute inset-0 grid place-items-center text-xs font-bold text-white">VS</span>
    </div>
  )
}

function fmt(value: number | null, kind: "pct" | "ratio" | "int") {
  if (value === null || !Number.isFinite(value)) return "—"
  if (kind === "pct") return `${value.toFixed(0)}%`
  if (kind === "ratio") return value.toFixed(2)
  return Math.round(value).toString()
}

function Portrait({ kind, name, align }: { kind: "agent" | "map"; name: string; align: "left" | "right" }) {
  const src = kind === "agent" ? getAgentAssets(name).card : (getMapAssets(name).card ?? getMapAssets(name).banner)
  return (
    <div
      className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 ${
        align === "right" ? "order-last" : ""
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fb718533,transparent_60%),linear-gradient(160deg,#1e293b,#0b1020)]" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="absolute inset-0 h-full w-full object-cover object-top" />
      ) : null}
    </div>
  )
}

function Side({ kind, side, align }: { kind: "agent" | "map"; side: EntitySide; align: "left" | "right" }) {
  const a = side.aggregate
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-3 ${align === "right" ? "items-end text-right" : ""}`}>
      <div className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse text-right" : ""}`}>
        <Portrait kind={kind} name={side.name} align={align} />
        <div className="min-w-0">
          <p className="truncate text-xl font-extrabold text-white">{side.name}</p>
          <p className="text-xs text-zinc-400">{a.games} partidas</p>
        </div>
      </div>
      <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${align === "right" ? "justify-end" : ""}`}>
        <Metric label="Winrate" value={fmt(a.winRate, "pct")} />
        <Metric label="KDA" value={fmt(a.kda, "ratio")} />
        <Metric label="ACS" value={fmt(a.avgAcs, "int")} />
        <Metric label="HS%" value={a.hsPct === null ? "—" : `${a.hsPct.toFixed(0)}%`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold text-white">{value}</span> <span className="text-[11px] text-zinc-500">{label}</span>
    </span>
  )
}

export function VersusPanel({
  kind,
  title,
  sideA,
  sideB,
  splitNoun,
  controls,
}: {
  kind: "agent" | "map"
  title: string
  sideA: EntitySide
  sideB: EntitySide
  splitNoun: string
  controls?: ReactNode
}) {
  const detailHref = kind === "agent" ? `/agents/${toSlug(sideA.name)}` : `/maps/${toSlug(sideA.name)}`

  return (
    <div className="premium-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">{title}</h3>
        {controls}
      </div>

      <div className="flex items-center gap-3">
        <Side kind={kind} side={sideA} align="left" />
        <Hexagon />
        <Side kind={kind} side={sideB} align="right" />
      </div>

      <div className="mt-4 grid grid-cols-1 items-center gap-3 border-t border-white/10 pt-3 text-xs sm:grid-cols-3">
        <p className="text-zinc-400">
          {splitNoun}:{" "}
          <span className="font-semibold text-emerald-300">
            {sideA.bestSplit ? `${sideA.bestSplit.name} (${sideA.bestSplit.winRate.toFixed(0)}% WR)` : "—"}
          </span>
        </p>
        <div className="flex justify-center">
          <Link
            href={detailHref}
            className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25"
          >
            Ver detalle completo
          </Link>
        </div>
        <p className="text-right text-zinc-400">
          {splitNoun}:{" "}
          <span className="font-semibold text-emerald-300">
            {sideB.bestSplit ? `${sideB.bestSplit.name} (${sideB.bestSplit.winRate.toFixed(0)}% WR)` : "—"}
          </span>
        </p>
      </div>
    </div>
  )
}
