"use client"

import { useMemo, useState } from "react"
import { Swords } from "lucide-react"

import { ComparisonBarChart } from "@/components/comparisons/comparison-bar-chart"
import { ComparisonLineChart } from "@/components/comparisons/comparison-line-chart"
import { ComparisonMetricCard } from "@/components/comparisons/comparison-metric-card"
import { EntityCompareCard } from "@/components/comparisons/entity-compare-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type Props = {
  matches: MatchPerformance[]
  agents: string[]
  maps: string[]
  now: number
}

const PERIOD_OPTIONS: Array<{ value: PeriodMode; label: string }> = [
  { value: "last5", label: "Últimas 5" },
  { value: "last10", label: "Últimas 10" },
  { value: "last20", label: "Últimas 20" },
  { value: "days7", label: "Últimos 7 días" },
  { value: "days30", label: "Últimos 30 días" },
]

function pctScaleBars(metrics: ComparisonMetric[]) {
  // Only chart same-scale (%) metrics so bars stay comparable.
  return metrics
    .filter((m) => (m.key === "winRate" || m.key === "hs") && m.current !== null && m.previous !== null)
    .map((m) => ({ metric: m.label, a: Math.round((m.current ?? 0) * 10) / 10, b: Math.round((m.previous ?? 0) * 10) / 10 }))
}

function Selector({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "w-44 border-white/15 bg-black/30 text-zinc-100"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ComparisonsView({ matches, agents, maps, now }: Props) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("last10")
  const [agentA, setAgentA] = useState(agents[0] ?? "")
  const [agentB, setAgentB] = useState(agents[1] ?? agents[0] ?? "")
  const [mapA, setMapA] = useState(maps[0] ?? "")
  const [mapB, setMapB] = useState(maps[1] ?? maps[0] ?? "")
  const [trendWindow, setTrendWindow] = useState("5")

  const period = useMemo(() => buildPeriodComparison(matches, periodMode, now), [matches, periodMode, now])
  const agentCmp = useMemo(() => buildAgentComparison(matches, agentA, agentB), [matches, agentA, agentB])
  const mapCmp = useMemo(() => buildMapComparison(matches, mapA, mapB), [matches, mapA, mapB])
  const winLoss = useMemo(() => buildWinsLossesComparison(matches), [matches])
  const trend = useMemo(() => buildRecentTrendComparison(matches, Number(trendWindow)), [matches, trendWindow])

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">{matches.length} partidas analizadas</p>

      <Tabs defaultValue="period">
        <TabsList className="flex-wrap">
          <TabsTrigger value="period">Periodo</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="maps">Mapas</TabsTrigger>
          <TabsTrigger value="winloss">Victorias vs Derrotas</TabsTrigger>
          <TabsTrigger value="trend">Evolución</TabsTrigger>
        </TabsList>

        {/* Periodo */}
        <TabsContent value="period" className="mt-5 space-y-5">
          {matches.length < 10 ? (
            <EmptyState title="Faltan partidas" description="Necesitas al menos 10 partidas para comparar periodos." />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">Comparar</span>
                <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
                  <SelectTrigger className="w-48 border-white/15 bg-black/30 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {period.available ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {period.metrics.map((m) => (
                      <ComparisonMetricCard
                        key={m.key}
                        metric={m}
                        currentLabel={period.currentLabel}
                        previousLabel={period.previousLabel}
                      />
                    ))}
                  </div>
                  <ChartCard title="Winrate y HS%">
                    <ComparisonBarChart
                      data={pctScaleBars(period.metrics)}
                      aLabel={period.currentLabel}
                      bLabel={period.previousLabel}
                    />
                  </ChartCard>
                </>
              ) : (
                <EmptyState title="Sin datos en este periodo" description="No hay partidas suficientes en ambos bloques para comparar." />
              )}
            </>
          )}
        </TabsContent>

        {/* Agentes */}
        <TabsContent value="agents" className="mt-5 space-y-5">
          {agents.length < 2 ? (
            <EmptyState title="Pocos agentes" description="Juega más agentes para activar esta comparativa." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Selector value={agentA} onChange={setAgentA} options={agents} />
                <span className="text-sm font-semibold text-zinc-500">VS</span>
                <Selector value={agentB} onChange={setAgentB} options={agents} />
              </div>
              {agentCmp.available && agentCmp.a && agentCmp.b ? (
                <SideBySide
                  kind="agent"
                  metrics={agentCmp.metrics}
                  a={agentCmp.a}
                  b={agentCmp.b}
                  aLabel={agentCmp.a.name}
                  bLabel={agentCmp.b.name}
                />
              ) : (
                <EmptyState title="Selecciona dos agentes" description="Elige dos agentes distintos con partidas para comparar." />
              )}
            </>
          )}
        </TabsContent>

        {/* Mapas */}
        <TabsContent value="maps" className="mt-5 space-y-5">
          {maps.length < 2 ? (
            <EmptyState title="Pocos mapas" description="Necesitas partidas en más mapas para comparar." />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Selector value={mapA} onChange={setMapA} options={maps} />
                <span className="text-sm font-semibold text-zinc-500">VS</span>
                <Selector value={mapB} onChange={setMapB} options={maps} />
              </div>
              {mapCmp.available && mapCmp.a && mapCmp.b ? (
                <SideBySide
                  kind="map"
                  metrics={mapCmp.metrics}
                  a={mapCmp.a}
                  b={mapCmp.b}
                  aLabel={mapCmp.a.name}
                  bLabel={mapCmp.b.name}
                />
              ) : (
                <EmptyState title="Selecciona dos mapas" description="Elige dos mapas distintos con partidas para comparar." />
              )}
            </>
          )}
        </TabsContent>

        {/* Victorias vs Derrotas */}
        <TabsContent value="winloss" className="mt-5 space-y-5">
          {winLoss.available ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {winLoss.metrics.map((m) => (
                  <ComparisonMetricCard key={m.key} metric={m} currentLabel="Victorias" previousLabel="Derrotas" />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ListCard
                  title="Agentes con mejor winrate"
                  rows={winLoss.topWinAgents.map((a) => ({ name: a.name, value: `${a.winRate.toFixed(0)}% · ${a.games}p` }))}
                />
                <ListCard
                  title="Mapas donde más pierdes"
                  rows={winLoss.topLossMaps.map((m) => ({ name: m.name, value: `${m.losses} derrotas / ${m.games}p` }))}
                />
              </div>
            </>
          ) : (
            <EmptyState title="Faltan resultados" description="Necesitas victorias y derrotas para comparar." />
          )}
        </TabsContent>

        {/* Evolución */}
        <TabsContent value="trend" className="mt-5 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Ventana</span>
            <Selector
              value={trendWindow}
              onChange={setTrendWindow}
              options={["5", "10"]}
              className="w-28 border-white/15 bg-black/30 text-zinc-100"
            />
          </div>
          {trend.available ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {trend.metrics
                  .filter((m) => ["winRate", "kda", "acs", "hs"].includes(m.key))
                  .map((m) => (
                    <ComparisonMetricCard
                      key={m.key}
                      metric={m}
                      currentLabel={`Últimas ${trend.windowSize}`}
                      previousLabel={`${trend.windowSize} anteriores`}
                    />
                  ))}
              </div>
              <ChartCard title="Evolución (ACS / KDA por partida)">
                <ComparisonLineChart data={trend.series} />
              </ChartCard>
            </>
          ) : (
            <EmptyState title="Faltan partidas" description={`Necesitas al menos ${Number(trendWindow) * 2} partidas para ver la evolución.`} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-5">
      <p className="mb-3 text-sm font-semibold text-zinc-300">{title}</p>
      {children}
    </div>
  )
}

function ListCard({ title, rows }: { title: string; rows: Array<{ name: string; value: string }> }) {
  return (
    <div className="premium-card p-5">
      <p className="mb-3 text-sm font-semibold text-zinc-300">{title}</p>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm">
              <span className="text-white">{r.name}</span>
              <span className="text-zinc-400">{r.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Sin datos suficientes.</p>
      )}
    </div>
  )
}

function SideBySide({
  kind,
  metrics,
  a,
  b,
  aLabel,
  bLabel,
}: {
  kind: "agent" | "map"
  metrics: ComparisonMetric[]
  a: Parameters<typeof EntityCompareCard>[0]["side"]
  b: Parameters<typeof EntityCompareCard>[0]["side"]
  aLabel: string
  bLabel: string
}) {
  return (
    <div className="space-y-5">
      <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <EntityCompareCard kind={kind} side={a} />
        <div className="flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-bold text-zinc-300">
            <Swords className="size-5" />
          </span>
        </div>
        <EntityCompareCard kind={kind} side={b} />
      </div>

      <div className="premium-card overflow-hidden">
        <div className="grid grid-cols-3 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
          <span className="text-rose-300">{aLabel}</span>
          <span className="text-center">Métrica</span>
          <span className="text-right text-cyan-300">{bLabel}</span>
        </div>
        {metrics.map((m) => {
          const aBetter = m.isPositive === true
          const bBetter = m.isPositive === false
          return (
            <div key={m.key} className="grid grid-cols-3 items-center px-5 py-2.5 text-sm odd:bg-white/[0.02]">
              <span className={aBetter ? "font-semibold text-emerald-300" : "text-white"}>
                {formatMetricValue(m.current, m.format)}
              </span>
              <span className="text-center text-zinc-400">{m.label}</span>
              <span className={bBetter ? "text-right font-semibold text-emerald-300" : "text-right text-white"}>
                {formatMetricValue(m.previous, m.format)}
              </span>
            </div>
          )
        })}
      </div>

      <ChartCard title="Winrate y HS%">
        <ComparisonBarChart data={pctScaleBars(metrics)} aLabel={aLabel} bLabel={bLabel} />
      </ChartCard>
    </div>
  )
}
