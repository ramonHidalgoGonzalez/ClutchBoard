import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

export default async function ComparativasPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  return (
    <AppShell title="Comparativas" subtitle="Compara periodos, agentes y mapas" connected>
      <EmptyState
        title="Comparativas en camino"
        description="Pronto podrás comparar tu rendimiento entre periodos, agentes y mapas lado a lado."
      />
    </AppShell>
  )
}
