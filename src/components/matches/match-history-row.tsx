import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { roleRingClass } from "@/lib/agent-roles"
import { formatQueue, formatResult } from "@/i18n/format"
import { defaultLocale, type Locale } from "@/i18n/locales"
import { getAgentCropPosition, getMapCropPosition } from "@/server/valorant/assets/asset-crop-overrides"
import { cn } from "@/lib/utils"
import type { MatchPerformance } from "@/types/domain"

function resultMeta(outcome: MatchPerformance["outcome"], locale: Locale) {
  const label = formatResult(outcome, locale).toUpperCase()
  if (outcome === "win") return { label, tone: "text-emerald-400", bar: "bg-emerald-400", glow: "shadow-[0_0_18px_-2px_rgba(52,211,153,0.5)]" }
  if (outcome === "loss") return { label, tone: "text-rose-400", bar: "bg-rose-500", glow: "shadow-[0_0_18px_-2px_rgba(244,63,94,0.5)]" }
  if (outcome === "draw") return { label, tone: "text-sky-300", bar: "bg-sky-400", glow: "" }
  return { label: "—", tone: "text-zinc-300", bar: "bg-zinc-500", glow: "" }
}

function when(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { d: "--", t: "" }
  return {
    d: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
    t: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  }
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className={cn("mt-0.5 whitespace-nowrap text-sm font-semibold text-white", tone)}>{value}</p>
    </div>
  )
}

/** Premium horizontal "match row" — a tracker card, not a table row. */
export function MatchHistoryRow({ match, compact = false, locale = defaultLocale }: { match: MatchPerformance; compact?: boolean; locale?: Locale }) {
  const m = resultMeta(match.outcome, locale)
  const w = when(match.startedAt)
  const ratio = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)
  const score = `${match.roundsWon ?? 0} - ${match.roundsLost ?? 0}`

  return (
    <Link
      href={`/matches/${match.matchId}`}
      className="premium-row group relative flex items-center gap-4 overflow-hidden py-3 pl-5 pr-3"
    >
      <span className={cn("absolute inset-y-2 left-0 w-1 rounded-full", m.bar, m.glow)} />

      {/* Result + score */}
      <div className="w-[92px] shrink-0 whitespace-nowrap">
        <p className={cn("text-[11px] font-bold tracking-wide", m.tone)}>{m.label}</p>
        <p className="text-lg font-extrabold text-white">{score}</p>
      </div>

      {/* Map */}
      <div className="flex w-[200px] shrink-0 items-center gap-3">
        <div className="h-[68px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_6px_18px_rgba(0,0,0,0.4)]">
          <MapThumbnail
            name={match.mapName}
            imageUrl={match.mapThumbImageUrl ?? match.mapImageUrl}
            iconUrl={match.mapIconUrl}
            size="lg"
            className="h-full w-full rounded-xl border-0"
            objectPosition={getMapCropPosition(match.mapName, "thumb")}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{match.mapName}</p>
          <p className="truncate text-xs text-zinc-400">{formatQueue(match.queueName || match.queueId, locale)}</p>
        </div>
      </div>

      {/* Agent */}
      <div className="flex w-[170px] shrink-0 items-center gap-3">
        <AgentAvatar
          name={match.agentName}
          imageUrl={match.agentTableImageUrl ?? match.agentImageUrl}
          iconUrl={match.agentIconUrl}
          size="md"
          framing="avatar"
          ringClassName={roleRingClass(match.agentName)}
          objectPosition={getAgentCropPosition(match.agentName, "table")}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{match.agentName}</p>
          <p className="text-xs text-zinc-500">{w.d}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-5 pr-2">
        <Stat label="Score" value={score} tone={m.tone} />
        <div className="min-w-0 text-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">KDA</p>
          <p className="mt-0.5 whitespace-nowrap text-sm font-semibold text-white">
            {`${match.kills} / ${match.deaths} / ${match.assists}`}
          </p>
          <p className="text-[11px] text-zinc-500">{ratio}</p>
        </div>
        <Stat label="ACS" value={String(match.acsEstimate ?? "--")} />
        {!compact ? (
          <Stat
            label="HS%"
            value={Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}
          />
        ) : null}
        {!compact ? (
          <Stat label="Duración" value={match.durationSeconds ? `${Math.round(match.durationSeconds / 60)} min` : "--"} />
        ) : null}
      </div>

      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition group-hover:border-white/25 group-hover:bg-white/10 group-hover:text-white">
        <ChevronRight className="size-4" />
      </span>
    </Link>
  )
}
