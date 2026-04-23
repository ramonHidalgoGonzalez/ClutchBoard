import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MapsPage() {
  await requireSession()
  const { maps } = await getImprovementData()

  return (
    <AppShell title="Maps" subtitle="Analisis por mapa">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {maps.map((map) => (
          <Card key={map.mapName} className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>{map.mapName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-300">
              <p>Partidas: {map.matches}</p>
              <p>Win rate: {map.winRate.toFixed(1)}%</p>
              <p>KDA: {map.kda.toFixed(2)}</p>
              <p>ACS: {map.avgAcs.toFixed(0)}</p>
              <p>Damage: {map.avgDamage.toFixed(0)}</p>
              <p>Consistencia: {map.consistencyScore.toFixed(0)}</p>
              <p>Muestra: {map.sampleLabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
