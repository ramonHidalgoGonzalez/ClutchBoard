import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MapPoolCard } from "@/components/maps/map-pool-card"
import { SectionHeader } from "@/components/dashboard/section-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MapsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const params = await searchParams
  const order = params.order ?? "matches"
  const { analytics } = await getImprovementData(session?.puuid)

  const maps = [...analytics.mapStats].sort((a, b) => {
    if (order === "winrate") {
      return b.winRate - a.winRate
    }
    return b.matches - a.matches
  })

  const bestMap = [...analytics.mapStats]
    .filter((map) => (map.sampleSize ?? 0) >= 4)
    .sort((a, b) => b.winRate - a.winRate)[0]
  const bestKey = bestMap?.mapId || bestMap?.mapName

  return (
    <AppShell title="Maps" subtitle="Analítica por mapa" connected>
      <div className="space-y-5">
        <SectionHeader
          title="Rendimiento por mapa"
          description="Métricas post-match por battleground. Haz clic en un mapa para ver el perfil completo."
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

        {maps.length ? (
          <div className="space-y-5">
            {maps.map((map) => {
              const mapMatches = analytics.filteredMatches.filter(
                (m) => (m.mapId || m.mapName) === (map.mapId || map.mapName),
              )
              const isBest = (map.mapId || map.mapName) === bestKey

              return (
                <MapPoolCard
                  key={map.mapId || map.mapName}
                  map={map}
                  matches={mapMatches}
                  allMatches={analytics.filteredMatches}
                  isBest={isBest}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            title="Sin datos de mapas"
            description="Necesitamos más partidas para calcular fortalezas y debilidades por mapa."
          />
        )}
      </div>
    </AppShell>
  )
}
