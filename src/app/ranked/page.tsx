import { redirect } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { RankedView } from "@/components/ranked/ranked-view"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"
import { getImprovementData } from "@/server/services/improvement-service"

export default async function RankedPage() {
  const session = await getCurrentSession()
  if (!session && !env.enableMockRiot) {
    redirect("/login")
  }

  const { analytics } = await getImprovementData(session?.puuid)
  const t = await getTranslations()

  return (
    <AppShell
      title={t("ranked.title")}
      subtitle={t("ranked.subtitle")}
      connected
      lastSyncedAt={new Date().toISOString()}
    >
      <RankedView matches={analytics.filteredMatches} now={new Date().getTime()} />
    </AppShell>
  )
}
