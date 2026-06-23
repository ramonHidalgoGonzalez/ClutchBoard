import { AppShell } from "@/components/app-shell"
import { RankedSkeleton } from "@/components/skeletons"

export default async function Loading() {
  return (
    <AppShell title="Ranked" subtitle="Cargando progresión…">
      <RankedSkeleton />
    </AppShell>
  )
}
