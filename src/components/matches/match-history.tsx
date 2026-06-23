"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Crosshair, Search, Star, Target, Trophy } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MatchHistoryRow } from "@/components/matches/match-history-row"
import { WinrateDonut } from "@/components/stats/winrate-donut"
import { roleRingClass } from "@/lib/agent-roles"
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
  RecentComparison,
} from "@/types/domain"

type MatchHistoryProps = {
  matches: MatchPerformance[]
  summary: AnalyticsSummary
  bestMap?: MapBreakdown | null
  topAgent?: AgentBreakdown | null
  recentVsPrevious?: RecentComparison | null
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

const PAGE_SIZES = [10, 20, 50, 0] as const

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

function deltaChip(delta?: number, suffix = "") {
  if (typeof delta !== "number" || !Number.isFinite(delta) || Math.abs(delta) < 0.05) {
    return null
  }
  const positive = delta > 0
  const rounded = Math.abs(delta) >= 10 ? Math.round(Math.abs(delta)) : Math.abs(delta).toFixed(2)
  return (
    <span className={positive ? "text-xs font-semibold text-emerald-400" : "text-xs font-semibold text-rose-400"}>
      {positive ? "▲" : "▼"} {rounded}
      {suffix}
    </span>
  )
}

function SummaryTile({
  label,
  value,
  sub,
  icon,
  accent,
  image,
  imagePosition = "bg-center",
  right,
}: {
  label: string
  value: string
  sub?: ReactNode
  icon?: ReactNode
  accent?: string
  image?: string | null
  imagePosition?: string
  right?: ReactNode
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
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            {icon ? <span className={accent}>{icon}</span> : null}
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
          {sub ? <div className="mt-0.5 text-xs text-zinc-400">{sub}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}

function pageWindow(current: number, count: number) {
  if (count <= 7) {
    return Array.from({ length: count }, (_, i) => i + 1)
  }
  const pages = new Set<number>([1, count, current, current - 1, current + 1])
  return Array.from(pages)
    .filter((p) => p >= 1 && p <= count)
    .sort((a, b) => a - b)
}

export function MatchHistory({
  matches,
  summary,
  bestMap,
  topAgent,
  recentVsPrevious,
}: MatchHistoryProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState("all")
  const [queue, setQueue] = useState("all")
  const [agent, setAgent] = useState("all")
  const [map, setMap] = useState("all")
  const [sort, setSort] = useState("date-desc")
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20)
  const [page, setPage] = useState(1)

  const queues = useMemo(() => uniqueBy(matches, (m) => m.queueName || m.queueId), [matches])
  const agents = useMemo(() => uniqueBy(matches, (m) => m.agentName), [matches])
  const maps = useMemo(() => uniqueBy(matches, (m) => m.mapName), [matches])
  const wins = useMemo(() => matches.filter((m) => m.outcome === "win").length, [matches])
  const losses = useMemo(() => matches.filter((m) => m.outcome === "loss").length, [matches])

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

    return rows
  }, [matches, query, result, queue, agent, map, sort])

  // Reset to first page whenever the result set or page size changes, without
  // an effect (adjust state during render — React's recommended pattern).
  const filterKey = `${query}|${result}|${queue}|${agent}|${map}|${sort}|${pageSize}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const total = filtered.length
  const size = pageSize === 0 ? Math.max(1, total) : pageSize
  const pageCount = Math.max(1, Math.ceil(total / size))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * size
  const paged = filtered.slice(start, start + size)

  return (
    <div className="space-y-5">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <SummaryTile
          label="Partidas"
          value={String(summary.totalMatches)}
          sub={`Últimos ${summary.totalMatches}`}
          icon={<Crosshair className="size-3.5" />}
          accent="text-indigo-300"
        />
        <SummaryTile
          label="Winrate"
          value={`${summary.winRate.toFixed(1)}%`}
          icon={<Trophy className="size-3.5" />}
          accent="text-emerald-300"
          right={<WinrateDonut value={summary.winRate} />}
          sub={`${wins} Victorias / ${losses} Derrotas`}
        />
        <SummaryTile
          label="KDA promedio"
          value={summary.averageKda.toFixed(2)}
          accent="text-sky-300"
          sub={deltaChip(recentVsPrevious?.kdaDelta)}
        />
        <SummaryTile
          label="ACS promedio"
          value={summary.averageAcs.toFixed(0)}
          icon={<Star className="size-3.5" />}
          accent="text-amber-300"
          sub={deltaChip(recentVsPrevious?.acsDelta)}
        />
        <SummaryTile
          label="HS% promedio"
          value={`${summary.averageHsPercent.toFixed(1)}%`}
          icon={<Target className="size-3.5" />}
          accent="text-rose-300"
        />
        <SummaryTile
          label="Mejor mapa"
          value={bestMap?.mapName ?? "--"}
          sub={bestMap ? `${bestMap.winRate.toFixed(0)}% Winrate` : undefined}
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
          {PAGE_SIZES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPageSize(value)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition",
                pageSize === value ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {value === 0 ? "Todas" : value}
            </button>
          ))}
        </div>
      </div>

      {/* Match rows (desktop) — tracker cards, not a table */}
      <div className="hidden flex-col gap-2.5 lg:flex">
        {paged.map((match) => (
          <MatchHistoryRow key={match.matchId} match={match} />
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 lg:hidden">
        {paged.map((match) => {
          const meta = resultMeta(match.outcome)
          const when = formatDateTime(match.startedAt)
          return (
            <Link
              key={match.matchId}
              href={`/matches/${match.matchId}`}
              className="relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            >
              {/* Map banner */}
              <div className="relative h-28 w-full">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={
                    match.mapBannerImageUrl ?? match.mapImageUrl
                      ? { backgroundImage: `url(${match.mapBannerImageUrl ?? match.mapImageUrl})` }
                      : undefined
                  }
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.2),rgba(9,9,11,0.85))]" />
                <span className={cn("absolute inset-y-0 left-0 w-1.5", meta.bar)} />
                <div className="absolute inset-0 flex items-end justify-between p-3">
                  <div className="whitespace-nowrap">
                    <p className={cn("text-xs font-bold", meta.tone)}>{meta.label}</p>
                    <p className="text-2xl font-extrabold text-white">
                      {`${match.roundsWon ?? 0} - ${match.roundsLost ?? 0}`}
                    </p>
                  </div>
                  <div className="text-right text-xs text-zinc-300">
                    <p className="font-semibold text-white">{match.mapName}</p>
                    <p>{when.date}</p>
                    <p>{when.time}</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <AgentAvatar
                    name={match.agentName}
                    imageUrl={match.agentTableImageUrl ?? match.agentImageUrl}
                    iconUrl={match.agentIconUrl}
                    size="lg"
                    framing="avatar"
                    ringClassName={roleRingClass(match.agentName)}
                  />
                  <div>
                    <p className="text-base font-semibold text-white">{match.agentName}</p>
                    <p className="text-xs text-zinc-400">{match.queueName || match.queueId}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { k: "KDA", v: `${match.kills}/${match.deaths}/${match.assists}` },
                    { k: "ACS", v: String(match.acsEstimate ?? "--") },
                    {
                      k: "HS%",
                      v: Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--",
                    },
                  ].map((stat) => (
                    <div key={stat.k} className="rounded-xl border border-white/10 bg-black/25 p-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{stat.k}</p>
                      <p className="text-sm font-semibold text-white">{stat.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {total === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-zinc-400">
          No hay partidas que coincidan con los filtros.
        </p>
      ) : (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-zinc-500">
            Mostrando {start + 1} a {Math.min(total, start + size)} de {total} partidas
          </p>
          {pageCount > 1 ? (
            <div className="flex items-center gap-1">
              <PagerButton disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                <ChevronLeft className="size-4" />
              </PagerButton>
              {pageWindow(safePage, pageCount).map((p, index, arr) => (
                <span key={p} className="flex items-center">
                  {index > 0 && p - arr[index - 1] > 1 ? (
                    <span className="px-1 text-zinc-600">…</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "size-8 rounded-lg text-sm font-semibold transition",
                      p === safePage ? "bg-rose-600 text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <PagerButton disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>
                <ChevronRight className="size-4" />
              </PagerButton>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
