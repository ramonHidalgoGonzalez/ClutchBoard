import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MapHeroCard } from "@/components/dashboard/map-hero-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MapsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const session = await requireSession()
  const params = await searchParams
  const order = params.order ?? "matches"
  const { analytics } = await getImprovementData(session.puuid)

  const maps = [...analytics.mapStats].sort((a, b) => {
    if (order === "winrate") {
      return b.winRate - a.winRate
    }
    return b.matches - a.matches
  })

  const bestMap = maps.filter((map) => (map.sampleSize ?? 0) >= 4).sort((a, b) => b.winRate - a.winRate)[0]
  const worstMap = maps.filter((map) => (map.sampleSize ?? 0) >= 4).sort((a, b) => a.winRate - b.winRate)[0]

  return (
    <AppShell title="Maps" subtitle="Analitica por mapa" connected>
      <div className="space-y-5">
        <SectionHeader
          title="Rendimiento por mapa"
          description="Metricas post-match por battleground con miniaturas oficiales cuando estan disponibles."
          actions={
            <form>
              <Select name="order" defaultValue={order}>
                <SelectTrigger className="w-40 border-white/15 bg-white/5 text-zinc-100">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matches">Partidas</SelectItem>
                  <SelectItem value="winrate">Winrate</SelectItem>
                </SelectContent>
              </Select>
            </form>
          }
        />

        {bestMap || worstMap ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Mejor mapa: {bestMap ? `${bestMap.mapName} (${bestMap.winRate.toFixed(1)}%)` : "Datos insuficientes"}
            </div>
            <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-4 text-sm text-rose-100">
              Peor mapa: {worstMap ? `${worstMap.mapName} (${worstMap.winRate.toFixed(1)}%)` : "Datos insuficientes"}
            </div>
          </div>
        ) : null}

        {maps.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {maps.map((map) => (
              <MapHeroCard key={map.mapName} map={map} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin datos de mapas"
            description="Necesitamos mas partidas para calcular fortalezas y debilidades por mapa."
          />
        )}
      </div>
    </AppShell>
  )
}
