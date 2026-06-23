import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { EmptyState } from "@/components/dashboard/empty-state"
import { VisualMapCard } from "@/components/maps/visual-map-card"
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

  const sampled = analytics.mapStats.filter((map) => (map.sampleSize ?? 0) >= 4)
  const bestMap = [...sampled].sort((a, b) => b.winRate - a.winRate)[0]
  const worstMap = [...sampled].sort((a, b) => a.winRate - b.winRate)[0]
  const bestKey = bestMap?.mapId || bestMap?.mapName
  const worstKey = worstMap?.mapId || worstMap?.mapName

  const t = await getTranslations()

  return (
    <AppShell title={t("maps.title")} subtitle={t("maps.subtitle")} connected>
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {maps.map((map) => {
              const mapMatches = analytics.filteredMatches.filter(
                (m) => (m.mapId || m.mapName) === (map.mapId || map.mapName),
              )
              const key = map.mapId || map.mapName
              const badge =
                key === bestKey
                  ? { label: "Mejor mapa", best: true }
                  : key === worstKey
                    ? { label: "Peor mapa", best: false }
                    : null

              return (
                <VisualMapCard key={map.mapId || map.mapName} map={map} matches={mapMatches} badge={badge} />
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
