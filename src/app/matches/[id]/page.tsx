import { notFound } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MatchResultBadge } from "@/components/dashboard/match-result-badge"
import { SectionHeader } from "@/components/dashboard/section-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireSession } from "@/server/auth/session"
import { getMatchById } from "@/server/services/match-service"

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireSession()
  const { id } = await params
  const { match, baseline, playerRows } = await getMatchById(id, session.puuid)

  if (!match) {
    notFound()
  }

  return (
    <AppShell title="Match Detail" subtitle={`${match.mapName || "Unknown Map"} · ${match.agentName || "Unknown Agent"}`}>
      <div className="space-y-6">
        <Card className="glass-panel text-white">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="text-sm text-zinc-300">Resumen de partida</p>
              <p className="text-xl font-semibold">{match.mapName || "Unknown Map"}</p>
              <p className="text-xs text-zinc-500">{match.queueName || "Unknown Queue"}</p>
            </div>
            <MatchResultBadge outcome={match.outcome || "unknown"} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="glass-panel text-white xl:col-span-2">
            <CardHeader>
              <SectionHeader title="Detalle principal" description="Estadisticas del jugador autenticado" />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Metric label="Resultado" value={match.outcome || "unknown"} />
              <Metric label="Cola" value={match.queueName || "Unknown Queue"} />
              <Metric label="Fecha" value={new Date(match.startedAt).toLocaleString("es-ES")} />
              <Metric label="Duracion" value={match.durationSeconds ? `${Math.round(match.durationSeconds / 60)} min` : "--"} />
              <Metric label="Marcador" value={`${match.roundsWon ?? 0}-${match.roundsLost ?? 0}`} />
              <Metric label="KDA" value={`${match.kills ?? 0}/${match.deaths ?? 0}/${match.assists ?? 0}`} />
              <Metric label="ACS estimado" value={Number.isFinite(match.acsEstimate) ? String(match.acsEstimate) : "--"} />
              <Metric label="Damage" value={Number.isFinite(match.damage) ? String(match.damage) : "--"} />
              <Metric
                label="Headshot %"
                value={Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}
              />
              <Metric label="First bloods" value={String(match.firstBloods ?? 0)} />
            </CardContent>
          </Card>

          <Card className="glass-panel text-white">
            <CardHeader>
              <CardTitle>Comparativa contra tu media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <p>ACS delta: {(match.acsEstimate - baseline.acs).toFixed(1)}</p>
              <p>
                KDA delta: {(((match.kills + match.assists) / Math.max(1, match.deaths)) - baseline.kda).toFixed(2)}
              </p>
              <p>Fuente oficial: kills, deaths, assists, score, match metadata.</p>
              <p>Fuente derivada: ACS estimado, headshot %, baseline historico y clutches.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel text-white">
          <CardHeader>
            <SectionHeader
              title="Jugadores de la partida"
              description="Tabla post-match. Se resaltan tus stats sin exponer datos sensibles."
            />
          </CardHeader>
          <CardContent>
            {playerRows.length ? (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>K</TableHead>
                      <TableHead>D</TableHead>
                      <TableHead>A</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerRows.map((row) => (
                      <TableRow
                        key={`${row.name}-${row.teamId}`}
                        className={row.name.startsWith(session.gameName) ? "bg-white/10" : "border-white/10"}
                      >
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.teamId || "--"}</TableCell>
                        <TableCell>{row.agentName || "Unknown Agent"}</TableCell>
                        <TableCell>{row.kills ?? 0}</TableCell>
                        <TableCell>{row.deaths ?? 0}</TableCell>
                        <TableCell>{row.assists ?? 0}</TableCell>
                        <TableCell>{row.score ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="No hay tabla de jugadores disponible"
                description="Riot no devolvio suficiente detalle de participantes para esta partida."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}
