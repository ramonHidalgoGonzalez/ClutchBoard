import { AppShell } from "@/components/app-shell"
import { AgentGridSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Agente" subtitle="Cargando perfil…">
      <AgentGridSkeleton />
    </AppShell>
  )
}
