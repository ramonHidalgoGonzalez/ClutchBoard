import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { SectionHeader } from "@/components/dashboard/section-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MatchTable } from "@/features/matches/match-table"
import { requireSession } from "@/server/auth/session"
import { getMatchesData } from "@/server/services/match-service"

export default async function MatchesPage() {
  const session = await requireSession()
  const { matches } = await getMatchesData(session.puuid)

  return (
    <AppShell title="Matches" subtitle="Historial, filtros y comparativas" connected lastSyncedAt={new Date().toISOString()}>
      <Card className="glass-panel text-white">
        <CardHeader>
          <SectionHeader
            title="Historial reciente"
            description="Post-match analytics personal. No scouting pre-game ni exposicion de datos sensibles."
          />
        </CardHeader>
        <CardContent>
          {matches.length ? (
            <MatchTable matches={matches} />
          ) : (
            <EmptyState
              title="No hay partidas para mostrar"
              description="Cuando Riot sincronice nuevas partidas, apareceran aqui con sus metricas clave."
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
