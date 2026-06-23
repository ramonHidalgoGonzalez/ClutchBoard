import { AppShell } from "@/components/app-shell"
import { DashboardSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Dashboard" subtitle="Cargando tu rendimiento…">
      <DashboardSkeleton />
    </AppShell>
  )
}
