"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Activity, Clock, Crosshair, Star, Target, TrendingUp, Trophy } from "lucide-react"

import { RankBadge } from "@/components/ranked/rank-badge"
import { ChartSkeleton, DonutSkeleton } from "@/components/charts/chart-skeleton"

const RankedProgressionChart = dynamic(
  () => import("@/components/ranked/ranked-progression-chart").then((m) => m.RankedProgressionChart),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> },
)
const RankDistributionDonut = dynamic(
  () => import("@/components/ranked/rank-distribution-donut").then((m) => m.RankDistributionDonut),
  { ssr: false, loading: () => <DonutSkeleton /> },
)
import { EmptyState } from "@/components/dashboard/empty-state"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { cn } from "@/lib/utils"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import { formatMetricValue, type ComparisonMetric } from "@/server/valorant/analytics/comparisons"
import {
  buildNextObjective,
  buildRankDistribution,
  buildRankProgression,
  buildRankedAgentStats,
  buildRankedInsights,
  buildRankedMapStats,
  buildRankedMetrics,
  buildRankedOverview,
  buildRankedStreaks,
  competitiveMatches,
} from "@/server/valorant/analytics/ranked"
import { recentFirst } from "@/analytics/entity-stats"
import type { MatchPerformance } from "@/types/domain"

const TABS = [
  { id: "act", label: "Acto Actual", icon: Trophy },
  { id: "last10", label: "Últimas 10 Ranked", icon: Activity },
  { id: "last20", label: "Últimas 20 Ranked", icon: Activity },
  { id: "days30", label: "Últimos 30 días", icon: Clock },
]

const METRIC_ICON: Record<string, typeof Crosshair> = {
  winRate: Trophy,
  kd: Star,
  acs: Activity,
  hs: Target,
  kills: Crosshair,
  duration: Clock,
}

export function RankedView({
  matches,
  now,
  rankLabel = "Rango actual",
}: {
  matches: MatchPerformance[]
  now: number
  rankLabel?: string
}) {
  const [tab, setTab] = useState("act")
  const [progMode, setProgMode] = useState<"index" | "date">("index")

  const ranked = useMemo(() => {
    const comp = competitiveMatches(matches)
    if (tab === "last10") return recentFirst(comp).slice(0, 10)
    if (tab === "last20") return recentFirst(comp).slice(0, 20)
    if (tab === "days30") {
      const cut = now - 30 * 24 * 60 * 60 * 1000
      return comp.filter((m) => new Date(m.startedAt).getTime() >= cut)
    }
    return comp
  }, [matches, tab, now])

  const overview = useMemo(() => buildRankedOverview(ranked), [ranked])
  const progression = useMemo(() => buildRankProgression(ranked), [ranked])
  const metrics = useMemo(() => buildRankedMetrics(ranked), [ranked])
  const agentStats = useMemo(() => buildRankedAgentStats(ranked), [ranked])
  const mapStats = useMemo(() => buildRankedMapStats(ranked), [ranked])
  const streak = useMemo(() => buildRankedStreaks(ranked), [ranked])
  const distribution = useMemo(() => buildRankDistribution(ranked), [ranked])
  const insights = useMemo(() => buildRankedInsights(ranked), [ranked])
  const objective = useMemo(() => buildNextObjective(overview), [overview])

  if (competitiveMatches(matches).length === 0) {
    return (
      <EmptyState
        title="Sin partidas competitivas"
        description="No hay suficientes partidas competitivas sincronizadas. Juega ranked o sincroniza más partidas para activar esta sección."
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                tab === t.id ? "bg-rose-600/90 text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Hero row */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="premium-card grid gap-5 p-5 md:grid-cols-3">
          {/* Rango actual */}
          <div className="flex items-center gap-4">
            <RankBadge tierId={overview.currentTierId} size={96} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">{rankLabel}</p>
              <p className="text-2xl font-extrabold text-violet-200">{overview.currentTierName ?? "Rango no disponible"}</p>
              <p className="mt-1 text-xs text-zinc-400">{overview.rrAvailable ? `${overview.rr} / 100 RR` : "RR no disponible"}</p>
              <div className="mt-3 flex gap-4 text-sm">
                <MiniKv label="Winrate" value={overview.winrate === null ? "—" : `${overview.winrate.toFixed(0)}%`} />
                <MiniKv label="K/D" value={overview.averageKd === null ? "—" : overview.averageKd.toFixed(2)} />
                <MiniKv label="ACS" value={overview.averageAcs === null ? "—" : overview.averageAcs.toFixed(0)} />
              </div>
            </div>
          </div>

          {/* Peak */}
          <div className="flex items-center gap-3 border-white/10 md:border-l md:pl-5">
            <RankBadge tierId={overview.peakTierId} size={64} />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Peak rank</p>
              <p className="text-xl font-extrabold text-violet-200">{overview.peakTierName ?? "—"}</p>
              <p className="mt-2 text-xs text-zinc-400">
                Mejor racha: <span className="font-semibold text-emerald-300">{streak.bestWin} victorias</span>
              </p>
              <p className="text-xs text-zinc-400">
                Peor racha: <span className="font-semibold text-rose-300">{streak.worstLoss} derrotas</span>
              </p>
            </div>
          </div>

          {/* Partidas competitivas */}
          <div className="border-white/10 md:border-l md:pl-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">Partidas competitivas</p>
            <p className="text-4xl font-extrabold text-white">{overview.rankedMatches}</p>
            <div className="mt-2 space-y-1 text-sm">
              <Row label="Victorias" value={overview.wins} tone="text-emerald-300" />
              <Row label="Derrotas" value={overview.losses} tone="text-rose-300" />
              <Row label="Empates" value={overview.draws} tone="text-zinc-300" />
            </div>
          </div>
        </div>

        {/* Racha actual */}
        <div className="premium-card p-5">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Racha actual</p>
          <div className="flex gap-2">
            {streak.results.length ? (
              streak.results.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-sm font-bold",
                    r === "W" ? "bg-emerald-500/20 text-emerald-300" : r === "L" ? "bg-rose-500/20 text-rose-300" : "bg-zinc-500/20 text-zinc-300",
                  )}
                >
                  {r}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-500">Sin datos</span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Streak label="Racha actual" value={`${streak.current.count} ${streak.current.type === "win" ? "victorias" : streak.current.type === "loss" ? "derrotas" : "—"}`} tone={streak.current.type === "win" ? "text-emerald-300" : "text-rose-300"} />
            <Streak label="Mejor racha" value={`${streak.bestWin} victorias`} tone="text-emerald-300" />
            <Streak label="Peor racha" value={`${streak.worstLoss} derrotas`} tone="text-rose-300" />
          </div>
        </div>
      </div>

      {/* Progression + metrics */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="premium-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Progreso de rango</p>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1 text-xs">
              <button type="button" onClick={() => setProgMode("index")} className={cn("rounded-lg px-3 py-1 font-semibold", progMode === "index" ? "bg-rose-600 text-white" : "text-zinc-400")}>
                Por partida
              </button>
              <button type="button" onClick={() => setProgMode("date")} className={cn("rounded-lg px-3 py-1 font-semibold", progMode === "date" ? "bg-rose-600 text-white" : "text-zinc-400")}>
                Por fecha
              </button>
            </div>
          </div>
          {progression.length >= 2 ? (
            <>
              <RankedProgressionChart points={progression} mode={progMode} />
              <p className="mt-2 text-xs text-zinc-500">Cada punto representa tu rango tras una partida competitiva.</p>
            </>
          ) : (
            <EmptyState title="Rango no disponible" description="Rango no disponible en las partidas sincronizadas." />
          )}
        </div>

        <div className="premium-card p-5">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Métricas competitivas</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metrics.map((m) => (
              <RankedMetric key={m.key} metric={m} />
            ))}
          </div>
        </div>
      </div>

      {/* Agents / Maps / Distribution */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Mejores agentes (Ranked)" footer={{ href: "/agents", label: "Ver todos los agentes" }}>
          <EntityList kind="agent" rows={agentStats.slice(0, 4)} />
        </Panel>
        <Panel title="Mejores mapas (Ranked)" footer={{ href: "/maps", label: "Ver todos los mapas" }}>
          <EntityList kind="map" rows={mapStats.slice(0, 5)} />
        </Panel>
        <Panel title="Distribución de rangos (Ranked)">
          {distribution.length ? (
            <RankDistributionDonut items={distribution} />
          ) : (
            <EmptyState title="Sin datos de rango" description="Rango no disponible en las partidas sincronizadas." />
          )}
        </Panel>
      </div>

      {/* Insights + objective */}
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel title="Insights competitivos">
          {insights.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 text-sm text-zinc-300">
                  <TrendingUp className="mt-0.5 size-4 shrink-0 text-rose-300" />
                  <span>{ins.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Juega más ranked para generar insights.</p>
          )}
        </Panel>
        <Panel title="Próximo objetivo">
          {objective.available ? (
            <div className="flex items-center gap-3">
              <RankBadge tierId={(overview.currentTierId ?? 0) + 1} size={56} />
              <div>
                <p className="text-xl font-extrabold text-violet-200">{objective.targetTierName ?? "—"}</p>
                <p className="mt-1 text-xs text-zinc-400">{objective.message}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-white">Objetivo no disponible</p>
              <p className="mt-1 text-xs text-zinc-400">{objective.message}</p>
            </div>
          )}
        </Panel>
      </div>

      <p className="pt-2 text-center text-xs text-zinc-600">
        Los datos se basan en tus partidas públicas de VALORANT. Puede haber pequeños retrasos en la actualización.
      </p>
    </div>
  )
}

function MiniKv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="font-bold text-white">{value}</p>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className={cn("font-bold", tone)}>{value}</span>
    </div>
  )
}

function Streak({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-2">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className={cn("mt-0.5 font-semibold", tone)}>{value}</p>
    </div>
  )
}

function Panel({ title, children, footer }: { title: string; children: React.ReactNode; footer?: { href: string; label: string } }) {
  return (
    <div className="premium-card flex flex-col p-5">
      <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">{title}</p>
      <div className="flex-1">{children}</div>
      {footer ? (
        <Link href={footer.href} className="mt-4 block rounded-xl border border-rose-500/30 bg-rose-500/15 py-2 text-center text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
          {footer.label}
        </Link>
      ) : null}
    </div>
  )
}

function RankedMetric({ metric }: { metric: ComparisonMetric }) {
  const Icon = METRIC_ICON[metric.key] ?? Activity
  const tone = metric.isPositive === true ? "text-emerald-400" : metric.isPositive === false ? "text-rose-400" : "text-zinc-400"
  const sign = (metric.delta ?? 0) > 0 ? "▲" : (metric.delta ?? 0) < 0 ? "▼" : ""
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
        <Icon className="size-3.5 text-rose-300" /> {metric.label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-white">{formatMetricValue(metric.current, metric.format)}</p>
      {metric.delta !== null && Math.abs(metric.delta) > 0.05 ? (
        <p className={cn("text-xs font-semibold", tone)}>
          {sign} {formatMetricValue(Math.abs(metric.delta), metric.format)} <span className="text-zinc-600">vs anterior</span>
        </p>
      ) : null}
    </div>
  )
}

function EntityList({ kind, rows }: { kind: "agent" | "map"; rows: Array<{ name: string; games: number; winRate: number; kd: number; acs: number }> }) {
  if (!rows.length) return <p className="text-sm text-zinc-500">Sin partidas ranked.</p>
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-2 text-[10px] uppercase tracking-wide text-zinc-500">
        <span>{kind === "agent" ? "Agente" : "Mapa"}</span>
        <span className="w-12 text-right">Partidas</span>
        <span className="w-14 text-right">Winrate</span>
        <span className="w-12 text-right">K/D</span>
        <span className="w-12 text-right">ACS</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
          <span className="flex min-w-0 items-center gap-2">
            {kind === "agent" ? (
              <AgentAvatar name={r.name} imageUrl={getAgentAssets(r.name).table} size="sm" framing="avatar" />
            ) : (
              <MapThumbnail name={r.name} imageUrl={getMapAssets(r.name).thumb} size="sm" />
            )}
            <span className="truncate text-sm font-medium text-white">{r.name}</span>
          </span>
          <span className="w-12 text-right text-sm text-zinc-300">{r.games}</span>
          <span className={cn("w-14 text-right text-sm font-semibold", r.winRate >= 50 ? "text-emerald-300" : "text-rose-300")}>{r.winRate.toFixed(1)}%</span>
          <span className="w-12 text-right text-sm text-white">{r.kd.toFixed(2)}</span>
          <span className="w-12 text-right text-sm text-white">{r.acs.toFixed(0)}</span>
        </div>
      ))}
    </div>
  )
}
