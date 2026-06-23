import { AppShell } from "@/components/app-shell"
import { AgentGridSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Agentes" subtitle="Cargando pool de agentes…">
      <AgentGridSkeleton />
    </AppShell>
  )
}
