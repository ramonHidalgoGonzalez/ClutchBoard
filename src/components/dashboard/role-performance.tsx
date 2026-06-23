import Link from "next/link"

import { resolveRole } from "@/components/agents/role-icon"

export type RoleRow = {
  label: string
  kda: number
  winRate: number
  matches: number
}

function barColor(winRate: number) {
  if (winRate >= 55) return "bg-emerald-400"
  if (winRate >= 45) return "bg-emerald-500/80"
  return "bg-amber-400"
}

export function RolePerformance({ rows }: { rows: RoleRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-zinc-500">Sin datos de rol todavía.</p>
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const { icon: Icon } = resolveRole(row.label)
        return (
          <div key={row.label} className="flex items-center gap-3">
            <Icon className="size-5 shrink-0 text-zinc-300" />
            <div className="w-28 shrink-0">
              <p className="text-sm font-medium text-white">{row.label}</p>
              <p className="text-xs text-zinc-500">KDA {row.kda.toFixed(2)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full ${barColor(row.winRate)}`}
                  style={{ width: `${Math.max(4, Math.min(100, Math.round(row.winRate)))}%` }}
                />
              </div>
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-semibold text-emerald-300">
              {row.winRate.toFixed(0)}% WR
            </span>
          </div>
        )
      })}
      <Link
        href="/improvement"
        className="mt-2 block rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-center text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
      >
        Ver análisis completo
      </Link>
    </div>
  )
}
