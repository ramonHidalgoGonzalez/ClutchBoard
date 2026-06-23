"use client"

import { useMemo, useState } from "react"
import { Activity, BarChart3, GitCompare, Map as MapIcon, Swords } from "lucide-react"

import { ComparisonLineChart } from "@/components/comparisons/comparison-line-chart"
import { ComparisonMetricCard } from "@/components/comparisons/comparison-metric-card"
import { VersusPanel } from "@/components/comparisons/versus-panel"
import { WinsLossesPanel } from "@/components/comparisons/wins-losses-panel"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  buildAgentComparison,
  buildMapComparison,
  buildPeriodComparison,
  buildRecentTrendComparison,
  buildWinsLossesComparison,
  formatMetricValue,
  type ComparisonMetric,
  type PeriodMode,
} from "@/server/valorant/analytics/comparisons"
import type { MatchPerformance } from "@/types/domain"

type Props = { matches: MatchPerformance[]; agents: string[]; maps: string[]; now: number }

const PERIOD_OPTIONS: Array<{ value: PeriodMode; label: string }> = [
  { value: "last5", label: "Últimas 5 partidas" },
  { value: "last10", label: "Últimas 10 partidas" },
  { value: "last20", label: "Últimas 20 partidas" },
  { value: "days7", label: "Últimos 7 días" },
  { value: "days30", label: "Últimos 30 días" },
]

const TABS = [
  { id: "period", label: "Periodo", icon: BarChart3 },
  { id: "agents", label: "Agentes", icon: Swords },
  { id: "maps", label: "Mapas", icon: MapIcon },
  { id: "winloss", label: "Victorias vs Derrotas", icon: GitCompare },
  { id: "trend", label: "Evolución", icon: Activity },
]

function PlainSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-40 border-white/15 bg-black/30 text-zinc-100"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function metric(metrics: ComparisonMetric[], key: string) {
  return metrics.find((m) => m.key === key)
}

export function ComparisonsView({ matches, agents, maps, now }: Props) {
  const [active, setActive] = useState("period")
  const [periodMode, setPeriodMode] = useState<PeriodMode>("last20")
  const [agentA, setAgentA] = useState(agents[0] ?? "")
  const [agentB, setAgentB] = useState(agents[1] ?? agents[0] ?? "")
  const [mapA, setMapA] = useState(maps[0] ?? "")
  const [mapB, setMapB] = useState(maps[1] ?? maps[0] ?? "")
  const [trendWindow, setTrendWindow] = useState("10")

  const period = useMemo(() => buildPeriodComparison(matches, periodMode, now), [matches, periodMode, now])
  const agentCmp = useMemo(() => buildAgentComparison(matches, agentA, agentB), [matches, agentA, agentB])
  const mapCmp = useMemo(() => buildMapComparison(matches, mapA, mapB), [matches, mapA, mapB])
  const winLoss = useMemo(() => buildWinsLossesComparison(matches), [matches])
  const trend = useMemo(() => buildRecentTrendComparison(matches, Number(trendWindow)), [matches, trendWindow])

  const agentOpts = agents.map((a) => ({ value: a, label: a }))
  const mapOpts = maps.map((m) => ({ value: m, label: m }))

  function goTo(id: string) {
    setActive(id)
    document.getElementById(`cmp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const acsTrend = metric(trend.metrics, "acs")
  const kdaTrend = metric(trend.metrics, "kda")

  return (
    <div className="space-y-6">
      {/* Top: tabs + period selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => goTo(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  active === t.id ? "bg-rose-600/90 text-white" : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Icon className="size-4" /> {t.label}
              </button>
            )
          })}
        </div>
        <PlainSelect
          value={periodMode}
          onChange={(v) => setPeriodMode(v as PeriodMode)}
          options={PERIOD_OPTIONS}
          className="w-52 border-white/15 bg-black/30 text-zinc-100"
        />
      </div>

      {/* Periodo */}
      <section id="cmp-period" className="premium-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Periodo actual vs anterior</h3>
            <p className="text-xs text-zinc-500">
              {period.currentLabel.toLowerCase()} vs {period.previousLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400" /> Periodo actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-zinc-500" /> Periodo anterior
            </span>
          </div>
        </div>
        {matches.length < 10 ? (
          <EmptyState title="Faltan partidas" description="Necesitas al menos 10 partidas para comparar periodos." />
        ) : period.available ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {period.metrics.map((m) => (
              <ComparisonMetricCard key={m.key} metric={m} />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin datos en este periodo" description="No hay partidas suficientes en ambos bloques." />
        )}
      </section>

      {/* Agente vs Agente | Mapa vs Mapa */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section id="cmp-agents">
          {agents.length < 2 ? (
            <div className="premium-card p-5">
              <EmptyState title="Pocos agentes" description="Juega más agentes para activar esta comparativa." />
            </div>
          ) : agentCmp.available && agentCmp.a && agentCmp.b ? (
            <VersusPanel
              kind="agent"
              title="Agente vs Agente"
              sideA={agentCmp.a}
              sideB={agentCmp.b}
              splitNoun="Mejor mapa"
              controls={
                <div className="flex items-center gap-2">
                  <PlainSelect value={agentA} onChange={setAgentA} options={agentOpts} className="w-32 border-white/15 bg-black/30 text-zinc-100" />
                  <PlainSelect value={agentB} onChange={setAgentB} options={agentOpts} className="w-32 border-white/15 bg-black/30 text-zinc-100" />
                </div>
              }
            />
          ) : (
            <div className="premium-card p-5">
              <EmptyState title="Selecciona dos agentes" description="Elige dos agentes distintos con partidas." />
            </div>
          )}
        </section>

        <section id="cmp-maps">
          {maps.length < 2 ? (
            <div className="premium-card p-5">
              <EmptyState title="Pocos mapas" description="Necesitas partidas en más mapas para comparar." />
            </div>
          ) : mapCmp.available && mapCmp.a && mapCmp.b ? (
            <VersusPanel
              kind="map"
              title="Mapa vs Mapa"
              sideA={mapCmp.a}
              sideB={mapCmp.b}
              splitNoun="Mejor agente"
              controls={
                <div className="flex items-center gap-2">
                  <PlainSelect value={mapA} onChange={setMapA} options={mapOpts} className="w-32 border-white/15 bg-black/30 text-zinc-100" />
                  <PlainSelect value={mapB} onChange={setMapB} options={mapOpts} className="w-32 border-white/15 bg-black/30 text-zinc-100" />
                </div>
              }
            />
          ) : (
            <div className="premium-card p-5">
              <EmptyState title="Selecciona dos mapas" description="Elige dos mapas distintos con partidas." />
            </div>
          )}
        </section>
      </div>

      {/* Victorias vs Derrotas | Evolución */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section id="cmp-winloss">
          {winLoss.available ? (
            <WinsLossesPanel data={winLoss} />
          ) : (
            <div className="premium-card p-5">
              <EmptyState title="Faltan resultados" description="Necesitas victorias y derrotas para comparar." />
            </div>
          )}
        </section>

        <section id="cmp-trend" className="premium-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Evolución reciente</h3>
            <PlainSelect
              value={trendWindow}
              onChange={setTrendWindow}
              options={[
                { value: "5", label: "Últimas 5 vs 5 anteriores" },
                { value: "10", label: "Últimas 10 vs 10 anteriores" },
              ]}
              className="w-52 border-white/15 bg-black/30 text-zinc-100"
            />
          </div>
          {trend.available ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <ComparisonLineChart
                data={trend.lines}
                recentLabel={`Últimas ${trend.windowSize} partidas`}
                previousLabel={`${trend.windowSize} anteriores`}
              />
              <div className="flex flex-row gap-3 lg:w-36 lg:flex-col">
                <TrendStat label="ACS medio" m={acsTrend} />
                <TrendStat label="KDA medio" m={kdaTrend} />
              </div>
            </div>
          ) : (
            <EmptyState title="Faltan partidas" description={`Necesitas al menos ${Number(trendWindow) * 2} partidas.`} />
          )}
        </section>
      </div>

      <p className="pt-2 text-center text-xs text-zinc-600">
        Los datos se basan en tus partidas públicas de VALORANT. Puede haber pequeños retrasos en la actualización.
      </p>
    </div>
  )
}

function TrendStat({ label, m }: { label: string; m: ComparisonMetric | undefined }) {
  if (!m) return null
  const tone = m.isPositive === true ? "text-emerald-400" : m.isPositive === false ? "text-rose-400" : "text-zinc-400"
  const sign = (m.delta ?? 0) > 0 ? "+" : (m.delta ?? 0) < 0 ? "−" : ""
  return (
    <div className="flex-1 rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-white">{formatMetricValue(m.current, m.format)}</p>
      {m.delta !== null ? (
        <p className={cn("text-xs font-semibold", tone)}>
          {sign}
          {formatMetricValue(Math.abs(m.delta), m.format)} <span className="text-zinc-500">vs anterior</span>
        </p>
      ) : null}
    </div>
  )
}
