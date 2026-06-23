import { AppShell } from "@/components/app-shell"
import { ComparisonSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Comparativas" subtitle="Cargando comparativas…">
      <ComparisonSkeleton />
    </AppShell>
  )
}
