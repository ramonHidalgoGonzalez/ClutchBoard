import { AppShell } from "@/components/app-shell"
import { MapGridSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Mapa" subtitle="Cargando perfil…">
      <MapGridSkeleton />
    </AppShell>
  )
}
