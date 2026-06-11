import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchTable } from "@/features/matches/match-table"
import { requireSession } from "@/server/auth/session"
import { getMatchesData } from "@/server/services/match-service"

export default async function MatchesPage() {
  const session = await requireSession()
  const { matches } = await getMatchesData(session.puuid)

  return (
    <AppShell title="Matches" subtitle="Historial, filtros y comparativas">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchTable matches={matches} />
        </CardContent>
      </Card>
    </AppShell>
  )
}
