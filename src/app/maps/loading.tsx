import { AppShell } from "@/components/app-shell"
import { MapGridSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Mapas" subtitle="Cargando mapas…">
      <MapGridSkeleton />
    </AppShell>
  )
}
