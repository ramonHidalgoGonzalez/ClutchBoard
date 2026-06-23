import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { EmptyState } from "@/components/dashboard/empty-state"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

export default async function NotasPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  return (
    <AppShell title="Notas de partida" subtitle="Tus apuntes post-match" connected>
      <EmptyState
        title="Notas en camino"
        description="Pronto podrás añadir notas y objetivos por partida para revisar tu progreso."
      />
    </AppShell>
  )
}
