import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HistoryCoverage } from "@/server/valorant/content/acts"

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  )
}

/** Dev-only history coverage card. Only render when NODE_ENV === "development". */
export function HistoryDiagnosticCard({ coverage }: { coverage: HistoryCoverage }) {
  const fmt = (d: string | null) => (d ? d.slice(0, 10) : "—")

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.04] text-white xl:col-span-2">
      <CardHeader>
        <CardTitle>Diagnóstico de histórico</CardTitle>
        <p className="text-sm text-zinc-400">Solo visible en desarrollo. Sin datos sensibles.</p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-300">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Sincronizadas" value={coverage.normalizedMatchesCount} />
          <Stat label="Con seasonId" value={coverage.matchesWithNormalizedSeasonId} />
          <Stat label="Con actId" value={coverage.matchesWithActId} />
          <Stat label="Sin acto" value={coverage.matchesWithoutAct} />
          <Stat label="Match más antiguo" value={fmt(coverage.oldestMatchDate)} />
          <Stat label="Match más reciente" value={fmt(coverage.newestMatchDate)} />
          <Stat label="Por seasonId" value={coverage.matchesMatchedToKnownAct} />
          <Stat label="Por fecha" value={coverage.matchesMatchedByDateFallback} />
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cobertura por acto</p>
          <div className="overflow-hidden rounded-lg border border-white/10">
            {coverage.actCoverage.map((a) => (
              <div
                key={a.actId}
                className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 last:border-0"
              >
                <span className="text-zinc-200">
                  {a.actLabel}
                  {a.isCurrent ? " · actual" : ""}
                </span>
                <span className="text-xs text-zinc-400">
                  {a.syncedMatches} sincronizadas · {a.rankedMatches} ranked
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          Algunos actos pueden aparecer sin partidas porque Clutchboard no tiene partidas sincronizadas de esos
          actos. Para completar histórico antiguo, la app necesita haber guardado esas partidas previamente o que
          Riot las devuelva en el matchlist disponible. No se inventan partidas.
        </p>
      </CardContent>
    </Card>
  )
}
