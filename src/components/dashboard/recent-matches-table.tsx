import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { cn } from "@/lib/utils"
import type { MatchPerformance } from "@/types/domain"

function meta(outcome: MatchPerformance["outcome"]) {
  if (outcome === "win") return { label: "VICTORIA", tone: "text-emerald-400", bar: "bg-emerald-400" }
  if (outcome === "loss") return { label: "DERROTA", tone: "text-rose-400", bar: "bg-rose-400" }
  if (outcome === "draw") return { label: "EMPATE", tone: "text-sky-300", bar: "bg-sky-300" }
  return { label: "—", tone: "text-zinc-300", bar: "bg-zinc-500" }
}

function when(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { d: "--", t: "" }
  return {
    d: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
    t: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  }
}

export function RecentMatchesTable({ matches }: { matches: MatchPerformance[] }) {
  if (!matches.length) {
    return <p className="px-4 py-6 text-sm text-zinc-400">Aún no hay partidas recientes.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-zinc-500">
            <th className="px-3 py-2 font-medium">Resultado</th>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Mapa</th>
            <th className="px-3 py-2 font-medium">Agente</th>
            <th className="px-3 py-2 font-medium">Score</th>
            <th className="px-3 py-2 font-medium">KDA</th>
            <th className="px-3 py-2 font-medium">ACS</th>
            <th className="px-3 py-2 font-medium">HS%</th>
            <th className="px-3 py-2 font-medium">Duración</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const m = meta(match.outcome)
            const w = when(match.startedAt)
            const ratio = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)
            return (
              <tr key={match.matchId} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("h-8 w-1 rounded-full", m.bar)} />
                    <span className={cn("rounded-md border border-current/20 px-2 py-0.5 text-[11px] font-bold", m.tone)}>
                      {m.label}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-zinc-300">
                  <p>{w.d}</p>
                  <p className="text-xs text-zinc-500">{w.t}</p>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <MapThumbnail name={match.mapName} imageUrl={match.mapImageUrl} iconUrl={match.mapIconUrl} size="sm" />
                    <span className="text-white">{match.mapName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <AgentAvatar name={match.agentName} imageUrl={match.agentImageUrl} iconUrl={match.agentIconUrl} size="sm" />
                    <span className="text-white">{match.agentName}</span>
                  </div>
                </td>
                <td className={cn("px-3 py-2.5 font-semibold", m.tone)}>
                  {match.roundsWon ?? 0} - {match.roundsLost ?? 0}
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-white">
                    {match.kills} / {match.deaths} / {match.assists}
                  </p>
                  <p className="text-xs text-zinc-500">{ratio}</p>
                </td>
                <td className="px-3 py-2.5 font-semibold text-white">{match.acsEstimate ?? "--"}</td>
                <td className="px-3 py-2.5 text-zinc-300">
                  {Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}
                </td>
                <td className="px-3 py-2.5 text-zinc-400">
                  {match.durationSeconds ? `${Math.round(match.durationSeconds / 60)} min` : "--"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link
                    href={`/matches/${match.matchId}`}
                    className="inline-flex size-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
