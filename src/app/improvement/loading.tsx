import { AppShell } from "@/components/app-shell"
import { ImprovementSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Mejora" subtitle="Cargando recomendaciones…">
      <ImprovementSkeleton />
    </AppShell>
  )
}
