import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import type { WinrateRow } from "@/analytics/entity-stats"

function barColor(winRate: number) {
  if (winRate >= 55) {
    return "bg-emerald-400"
  }
  if (winRate >= 45) {
    return "bg-amber-400"
  }
  return "bg-rose-400"
}

type WinrateBarsProps = {
  rows: WinrateRow[]
  kind: "agent" | "map"
  limit?: number
  showCount?: boolean
}

/** Shared winrate bar list used for "winrate by map" and "winrate by agent". */
export function WinrateBars({ rows, kind, limit = 4, showCount = false }: WinrateBarsProps) {
  if (!rows.length) {
    return <p className="text-xs text-zinc-500">Sin datos suficientes.</p>
  }

  return (
    <div className="space-y-3">
      {rows.slice(0, limit).map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <div className="shrink-0">
            {kind === "map" ? (
              <MapThumbnail name={row.name} imageUrl={row.imageUrl} iconUrl={row.iconUrl} size="sm" />
            ) : (
              <AgentAvatar name={row.name} imageUrl={row.imageUrl} iconUrl={row.iconUrl} size="sm" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-white">{row.name}</span>
              <span className="shrink-0 text-sm font-semibold text-white">
                {Math.round(row.winRate)}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full ${barColor(row.winRate)}`}
                style={{ width: `${Math.max(4, Math.min(100, Math.round(row.winRate)))}%` }}
              />
            </div>
          </div>
          {showCount ? (
            <span className="w-16 shrink-0 text-right text-xs text-zinc-400">
              {row.total} {row.total === 1 ? "partida" : "partidas"}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
