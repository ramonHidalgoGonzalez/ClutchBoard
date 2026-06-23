import { notFound, redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { EntityDetail } from "@/components/entity/entity-detail"
import { winrateBy } from "@/analytics/entity-stats"
import { env } from "@/lib/env"
import { toSlug } from "@/lib/slug"
import { getMapAssets } from "@/server/valorant/assets/map-assets"
import { RankedEntityCard } from "@/components/ranked/ranked-entity-card"
import { buildRankedAgentStats, buildRankedOverview } from "@/server/valorant/analytics/ranked"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"
import { AnalyticsScopeSelector } from "@/components/analytics/analytics-scope-selector"
import { resolveScopeFromSearchParams } from "@/server/valorant/analytics/scope-filter"

export default async function MapDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { slug } = await params
  const scope = resolveScopeFromSearchParams(await searchParams)
  const { analytics, acts, syncedTotal } = await getImprovementData(session?.puuid, scope)

  const map = analytics.mapStats.find(
    (candidate) => toSlug(candidate.mapName || candidate.mapId || "") === slug,
  )

  if (!map) {
    notFound()
  }

  const matches = analytics.filteredMatches.filter(
    (m) => (m.mapId || m.mapName) === (map.mapId || map.mapName),
  )
  const breakdownRows = winrateBy(matches, (m) => ({
    key: m.agentId || m.agentName,
    name: m.agentName,
    imageUrl: m.agentImageUrl,
    iconUrl: m.agentIconUrl,
  }))

  const bestMap = [...analytics.mapStats]
    .filter((candidate) => (candidate.sampleSize ?? 0) >= 4)
    .sort((a, b) => b.winRate - a.winRate)[0]
  const isBest = bestMap && (map.mapId || map.mapName) === (bestMap.mapId || bestMap.mapName)

  const rankedAgents = buildRankedAgentStats(matches)
  const rankedCard = (
    <RankedEntityCard
      title={`Rendimiento ranked en ${map.mapName}`}
      overview={buildRankedOverview(matches)}
      splitNoun="agente"
      bestName={rankedAgents[0]?.name ?? null}
      worstName={rankedAgents.length > 1 ? rankedAgents[rankedAgents.length - 1]?.name : null}
    />
  )

  return (
    <AppShell title={map.mapName} subtitle="Perfil de mapa" connected>
      <div className="mb-5 flex justify-end">
        <AnalyticsScopeSelector scope={scope} acts={acts} syncedTotal={syncedTotal} />
      </div>
      <EntityDetail
        kind="map"
        name={map.mapName}
        imageUrl={getMapAssets(map.mapName).banner ?? map.mapImageUrl}
        subtitle="Mapa"
        matches={matches}
        allMatches={analytics.filteredMatches}
        breakdownTitle="Agentes más usados"
        breakdownRows={breakdownRows}
        breakdownKind="agent"
        highlight={isBest ? { label: "Mejor mapa" } : null}
        backHref="/maps"
        backLabel="Volver a mapas"
        ranked={rankedCard}
      />
    </AppShell>
  )
}
