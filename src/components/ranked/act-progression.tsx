import type { ActProgressionRow } from "@/server/valorant/analytics/act-progression"

function fmt(n: number | null, suffix = "", digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return `${n.toFixed(digits)}${suffix}`
}

function badgeClass(source: string): string {
  if (source === "riot") return "bg-emerald-500/15 text-emerald-300"
  if (source === "manual") return "bg-sky-500/15 text-sky-300"
  return "bg-amber-500/15 text-amber-300"
}

export function ActProgression({ rows }: { rows: ActProgressionRow[] }) {
  if (!rows.length) return null

  const hasExternalOnly = rows.some((r) => !r.isReal)

  return (
    <section className="premium-card mt-6 p-5">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-[0.14em] text-zinc-300">Progresión por actos</h3>
      <p className="mb-4 text-xs text-zinc-500">
        Combina actos con partidas reales sincronizadas desde Riot y resúmenes externos/manuales. Cada fila indica su
        fuente; los datos no se mezclan.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-3">Acto</th>
              <th className="px-3">Fuente</th>
              <th className="px-3">Partidas</th>
              <th className="px-3">Winrate</th>
              <th className="px-3">KDA</th>
              <th className="px-3">ACS</th>
              <th className="px-3">HS%</th>
              <th className="px-3">Rango final</th>
              <th className="px-3">Peak</th>
              <th className="px-3">Agente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-white/5">
                <td className="py-2 pr-3 font-medium text-zinc-100">{r.actLabel}</td>
                <td className="px-3">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${badgeClass(r.source)}`}>
                    {r.badge}
                  </span>
                </td>
                <td className="px-3 text-zinc-300">{fmt(r.games)}</td>
                <td className="px-3 text-zinc-300">{fmt(r.winRate, "%", 1)}</td>
                <td className="px-3 text-zinc-300">{fmt(r.kda, "", 2)}</td>
                <td className="px-3 text-zinc-300">{fmt(r.acs)}</td>
                <td className="px-3 text-zinc-300">{fmt(r.hsPct, "%", 1)}</td>
                <td className="px-3 text-zinc-300">{r.finalRank ?? "—"}</td>
                <td className="px-3 text-zinc-300">{r.peakRank ?? "—"}</td>
                <td className="px-3 text-zinc-300">{r.mainAgent ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasExternalOnly ? (
        <p className="mt-3 text-xs text-zinc-500">
          Las filas marcadas como Manual/Importado provienen de resúmenes externos que añadiste; algunos actos no tienen
          partidas completas sincronizadas desde Riot y usan ese resumen.
        </p>
      ) : null}
    </section>
  )
}
