import { AppShell } from "@/components/app-shell"
import { MatchHistorySkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Partidas" subtitle="Cargando historial…">
      <MatchHistorySkeleton />
    </AppShell>
  )
}
