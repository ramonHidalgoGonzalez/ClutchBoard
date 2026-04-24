import { AppShell } from "@/components/app-shell"
import { GameMediaCard } from "@/components/game-media-card"
import { requireSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function MapsPage() {
  await requireSession()
  const { maps, content } = await getImprovementData()

  return (
    <AppShell title="Maps" subtitle="Analisis por mapa">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {maps.map((map) => (
          <GameMediaCard
            key={map.mapName}
            kind="map"
            name={map.mapName}
            officialAssetPath={content?.maps.find((item) => item.name === map.mapName)?.assetPath}
            title={map.mapName}
            subtitle={map.matches === 0 ? "Sin partidas registradas aun" : `Muestra ${map.sampleLabel}`}
            stats={[
              { label: "Partidas", value: String(map.matches) },
              { label: "Win rate", value: `${map.winRate.toFixed(1)}%` },
              { label: "KDA", value: map.kda.toFixed(2) },
              { label: "ACS", value: map.avgAcs.toFixed(0) },
              { label: "Damage", value: map.avgDamage.toFixed(0) },
              { label: "Consistencia", value: map.consistencyScore.toFixed(0) },
            ]}
            footer={
              map.matches === 0
                ? "Este mapa aparece por catalogo oficial aunque todavia no tengas partidas registradas en el dataset actual."
                : "Cuando Riot entregue media utilizable en content, esta vista podra ensenarla sin cambiar la capa analitica."
            }
          />
        ))}
      </div>
    </AppShell>
  )
}
