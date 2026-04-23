import { notFound } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/server/auth/session"
import { getMatchById } from "@/server/services/match-service"

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSession()
  const { id } = await params
  const { match, baseline } = await getMatchById(id)

  if (!match) {
    notFound()
  }

  return (
    <AppShell title="Match Detail" subtitle={`${match.mapName} · ${match.agentName}`}>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Detalle principal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Metric label="Resultado" value={match.outcome} />
            <Metric label="Cola" value={match.queueName} />
            <Metric label="Duracion" value={`${Math.round(match.durationSeconds / 60)} min`} />
            <Metric label="Marcador" value={`${match.roundsWon}-${match.roundsLost}`} />
            <Metric label="KDA" value={`${match.kills}/${match.deaths}/${match.assists}`} />
            <Metric label="ACS estimado" value={String(match.acsEstimate)} />
            <Metric label="Damage" value={String(match.damage)} />
            <Metric label="Headshot %" value={`${match.headshotPct.toFixed(1)}%`} />
            <Metric label="First bloods" value={String(match.firstBloods)} />
            <Metric label="Clutches" value={String(match.clutches)} />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Comparativa contra tu media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <p>ACS delta: {(match.acsEstimate - baseline.acs).toFixed(1)}</p>
            <p>
              KDA delta:{" "}
              {(((match.kills + match.assists) / Math.max(1, match.deaths)) - baseline.kda).toFixed(2)}
            </p>
            <p>Fuente oficial: kills, deaths, assists, score, match metadata.</p>
            <p>Fuente derivada: ACS estimado, headshot %, baseline histórico y clutches.</p>
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
