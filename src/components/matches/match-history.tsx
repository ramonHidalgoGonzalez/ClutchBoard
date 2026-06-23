"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, Crosshair, Search, Star, Target, Trophy } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  AgentBreakdown,
  AnalyticsSummary,
  MapBreakdown,
  MatchPerformance,
} from "@/types/domain"

type MatchHistoryProps = {
  matches: MatchPerformance[]
  summary: AnalyticsSummary
  bestMap?: MapBreakdown | null
  topAgent?: AgentBreakdown | null
  lastSyncedAt?: string
}

const RESULT_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "win", label: "Victoria" },
  { value: "loss", label: "Derrota" },
]

const SORT_OPTIONS = [
  { value: "date-desc", label: "Fecha (más reciente)" },
  { value: "date-asc", label: "Fecha (más antigua)" },
  { value: "acs-desc", label: "ACS (mayor)" },
  { value: "kda-desc", label: "KDA (mayor)" },
]

const LIMITS = [10, 20, 50, 0] as const

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: "--", time: "" }
  }
  return {
    date: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
    time: date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  }
}

function kdaRatio(match: MatchPerformance) {
  return ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)
}

function resultMeta(outcome: MatchPerformance["outcome"]) {
  if (outcome === "win") {
    return { label: "VICTORIA", tone: "text-emerald-400", bar: "bg-emerald-400" }
  }
  if (outcome === "loss") {
    return { label: "DERROTA", tone: "text-rose-400", bar: "bg-rose-400" }
  }
  if (outcome === "draw") {
    return { label: "EMPATE", tone: "text-sky-300", bar: "bg-sky-300" }
  }
  return { label: "—", tone: "text-zinc-300", bar: "bg-zinc-500" }
}

function uniqueBy(matches: MatchPerformance[], pick: (m: MatchPerformance) => string) {
  return Array.from(new Set(matches.map(pick).filter(Boolean))).sort()
}

function SummaryTile({
  label,
  value,
  sub,
  icon,
  accent,
  image,
  imagePosition = "bg-center",
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  accent?: string
  image?: string | null
  imagePosition?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4">
      {image ? (
        <div
          className={`absolute inset-0 bg-cover ${imagePosition} opacity-25`}
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden="true"
        />
      ) : null}
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{label}</p>
          {icon ? <span className={accent}>{icon}</span> : null}
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        {sub ? <p className="text-xs text-emerald-300">{sub}</p> : null}
      </div>
    </div>
  )
}

export function MatchHistory({ matches, summary, bestMap, topAgent, lastSyncedAt }: MatchHistoryProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("all")
  const [queue, setQueue] = useState("all")
  const [agent, setAgent] = useState("all")
  const [map, setMap] = useState("all")
  const [sort, setSort] = useState("date-desc")
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(20)

  const queues = useMemo(() => uniqueBy(matches, (m) => m.queueName || m.queueId), [matches])
  const agents = useMemo(() => uniqueBy(matches, (m) => m.agentName), [matches])
  const maps = useMemo(() => uniqueBy(matches, (m) => m.mapName), [matches])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const rows = matches.filter((m) => {
      if (result !== "all" && m.outcome !== result) return false
      if (queue !== "all" && (m.queueName || m.queueId) !== queue) return false
      if (agent !== "all" && m.agentName !== agent) return false
      if (map !== "all" && m.mapName !== map) return false
      if (text) {
        const haystack = `${m.mapName} ${m.agentName} ${m.queueName}`.toLowerCase()
        if (!haystack.includes(text)) return false
      }
      return true
    })

    rows.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        case "acs-desc":
          return (b.acsEstimate ?? 0) - (a.acsEstimate ?? 0)
        case "kda-desc":
          return Number(kdaRatio(b)) - Number(kdaRatio(a))
        default:
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      }
    })

    return limit ? rows.slice(0, limit) : rows
  }, [matches, query, result, queue, agent, map, sort, limit])

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryTile
          label="Partidas"
          value={String(summary.totalMatches)}
          icon={<Crosshair className="size-4" />}
          accent="text-indigo-300"
        />
        <SummaryTile
          label="Winrate"
          value={`${summary.winRate.toFixed(1)}%`}
          icon={<Trophy className="size-4" />}
          accent="text-emerald-300"
        />
        <SummaryTile label="KDA promedio" value={summary.averageKda.toFixed(2)} accent="text-sky-300" />
        <SummaryTile label="ACS promedio" value={summary.averageAcs.toFixed(0)} icon={<Star className="size-4" />} accent="text-amber-300" />
        <SummaryTile label="HS% promedio" value={`${summary.averageHsPercent.toFixed(1)}%`} icon={<Target className="size-4" />} accent="text-rose-300" />
        <SummaryTile
          label="Mejor mapa"
          value={bestMap?.mapName ?? "--"}
          sub={bestMap ? `${bestMap.winRate.toFixed(0)}% WR` : undefined}
          image={bestMap?.mapImageUrl}
        />
        <SummaryTile
          label="Agente más jugado"
          value={topAgent?.agentName ?? "--"}
          sub={topAgent ? `${topAgent.matches} partidas` : undefined}
          image={topAgent?.agentImageUrl}
          imagePosition="bg-top"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por mapa, agente o cola..."
            className="border-white/15 bg-black/30 pl-9 text-zinc-100"
          />
        </div>

        <FilterSelect value={result} onChange={setResult} placeholder="Resultado" options={RESULT_OPTIONS} />
        <FilterSelect
          value={queue}
          onChange={setQueue}
          placeholder="Cola"
          options={[{ value: "all", label: "Todas" }, ...queues.map((q) => ({ value: q, label: q }))]}
        />
        <FilterSelect
          value={agent}
          onChange={setAgent}
          placeholder="Agente"
          options={[{ value: "all", label: "Todos" }, ...agents.map((a) => ({ value: a, label: a }))]}
        />
        <FilterSelect
          value={map}
          onChange={setMap}
          placeholder="Mapa"
          options={[{ value: "all", label: "Todos" }, ...maps.map((m) => ({ value: m, label: m }))]}
        />
        <FilterSelect value={sort} onChange={setSort} placeholder="Ordenar por" options={SORT_OPTIONS} />

        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {LIMITS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setLimit(value)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition",
                limit === value ? "bg-rose-500/80 text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {value === 0 ? "Todas" : value}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              <th className="px-4 py-3 font-medium">Resultado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Cola</th>
              <th className="px-4 py-3 font-medium">Mapa</th>
              <th className="px-4 py-3 font-medium">Agente</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">KDA</th>
              <th className="px-4 py-3 font-medium">ACS</th>
              <th className="px-4 py-3 font-medium">HS%</th>
              <th className="px-4 py-3 font-medium">Duración</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((match) => {
              const meta = resultMeta(match.outcome)
              const when = formatDateTime(match.startedAt)
              return (
                <tr key={match.matchId} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn("h-9 w-1 rounded-full", meta.bar)} />
                      <div>
                        <p className={cn("text-xs font-bold", meta.tone)}>{meta.label}</p>
                        <p className="font-semibold text-white">
                          {match.roundsWon ?? 0} - {match.roundsLost ?? 0}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    <p>{when.date}</p>
                    <p className="text-xs text-zinc-500">{when.time}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{match.queueName || match.queueId}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <MapThumbnail name={match.mapName} imageUrl={match.mapImageUrl} iconUrl={match.mapIconUrl} size="md" />
                      <span className="text-white">{match.mapName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AgentAvatar name={match.agentName} imageUrl={match.agentImageUrl} iconUrl={match.agentIconUrl} size="sm" />
                      <span className="text-white">{match.agentName}</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 font-semibold", meta.tone)}>
                    {match.roundsWon ?? 0} - {match.roundsLost ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">
                      {match.kills} / {match.deaths} / {match.assists}
                    </p>
                    <p className="text-xs text-zinc-500">{kdaRatio(match)}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{match.acsEstimate ?? "--"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {match.durationSeconds ? `${Math.round(match.durationSeconds / 60)} min` : "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/matches/${match.matchId}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
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

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((match) => {
          const meta = resultMeta(match.outcome)
          const when = formatDateTime(match.startedAt)
          return (
            <Link
              key={match.matchId}
              href={`/matches/${match.matchId}`}
              className="relative block overflow-hidden rounded-2xl border border-white/10 border-l-2 bg-white/5 p-4"
              style={{ borderLeftColor: "transparent" }}
            >
              <span className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} />
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-xs font-bold", meta.tone)}>{meta.label}</p>
                  <p className="text-lg font-semibold text-white">
                    {match.roundsWon ?? 0} - {match.roundsLost ?? 0}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <p>{when.date}</p>
                  <p>{when.time}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <MapThumbnail name={match.mapName} imageUrl={match.mapImageUrl} iconUrl={match.mapIconUrl} size="sm" />
                <AgentAvatar name={match.agentName} imageUrl={match.agentImageUrl} iconUrl={match.agentIconUrl} size="sm" />
                <div className="text-sm text-zinc-200">
                  {match.mapName} · {match.agentName}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">KDA</p>
                  <p className="text-white">
                    {match.kills}/{match.deaths}/{match.assists}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">ACS</p>
                  <p className="text-white">{match.acsEstimate ?? "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">HS%</p>
                  <p className="text-white">
                    {Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-400">
          No hay partidas que coincidan con los filtros.
        </p>
      ) : null}

      {lastSyncedAt ? (
        <p className="text-right text-xs text-zinc-600">
          Mostrando {filtered.length} de {matches.length} partidas
        </p>
      ) : null}
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: Array<{ value: string; label: string }>
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36 border-white/15 bg-black/30 text-zinc-100">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
