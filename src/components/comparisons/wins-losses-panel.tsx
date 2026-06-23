import Link from "next/link"

import type { Aggregate, WinsLossesComparison } from "@/server/valorant/analytics/comparisons"

function f(value: number | null, kind: "pct" | "ratio" | "int") {
  if (value === null || !Number.isFinite(value)) return "—"
  if (kind === "pct") return `${value.toFixed(0)}%`
  if (kind === "ratio") return value.toFixed(2)
  return Math.round(value).toString()
}

function OutcomeCard({ title, tone, agg }: { title: string; tone: "win" | "loss"; agg: Aggregate }) {
  const styles =
    tone === "win"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-rose-500/30 bg-rose-500/10"
  const titleTone = tone === "win" ? "text-emerald-300" : "text-rose-300"
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 ${styles}`}>
      <p className={`text-sm font-bold ${titleTone}`}>{title}</p>
      <p className="text-xs text-zinc-400">{agg.games} partidas</p>
      <div className="mt-3 flex items-end gap-4">
        <div>
          <p className="text-2xl font-extrabold text-white">{f(agg.kda, "ratio")}</p>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">KDA</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-white">{f(agg.avgAcs, "int")}</p>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">ACS</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-zinc-300">
        <span className="font-bold text-white">{agg.hsPct === null ? "—" : `${agg.hsPct.toFixed(0)}%`}</span> HS%
      </p>
    </div>
  )
}

function CenterDonut({ winRate, wins, losses }: { winRate: number; wins: number; losses: number }) {
  const size = 132
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, winRate)) / 100) * c
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f43f5e" strokeWidth="11" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#34d399"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{winRate.toFixed(0)}%</span>
        <span className="text-xs text-zinc-400">Winrate</span>
        <span className="mt-0.5 text-xs font-semibold text-zinc-300">
          {wins}W - {losses}L
        </span>
      </div>
    </div>
  )
}

export function WinsLossesPanel({ data }: { data: WinsLossesComparison }) {
  const w = data.wins.games
  const l = data.losses.games
  const winRate = w + l > 0 ? (w / (w + l)) * 100 : 0

  return (
    <div className="premium-card p-5">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Victorias vs Derrotas</h3>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <OutcomeCard title="En victorias" tone="win" agg={data.wins} />
        <CenterDonut winRate={winRate} wins={w} losses={l} />
        <OutcomeCard title="En derrotas" tone="loss" agg={data.losses} />
      </div>
      <div className="mt-4 flex justify-center">
        <Link
          href="/matches?periodDays=90"
          className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/25"
        >
          Ver análisis completo
        </Link>
      </div>
    </div>
  )
}
