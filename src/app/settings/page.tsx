import { AppShell } from "@/components/app-shell"
import { getTranslations } from "@/i18n/get-dictionary"
import { LanguageSelector } from "@/components/settings/language-selector"
import { HistoryDiagnosticCard } from "@/components/settings/history-diagnostic-card"
import { HistorySyncCard } from "@/components/settings/history-sync-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { env } from "@/lib/env"
import { requireSession } from "@/server/auth/session"
import { getHistoryCoverage } from "@/server/services/analytics-service"

export default async function SettingsPage() {
  const session = await requireSession()
  const t = await getTranslations()
  const coverage = await getHistoryCoverage(session.puuid).catch(() => null)
  const isDev = process.env.NODE_ENV === "development"

  return (
    <AppShell title={t("settings.title")} subtitle={t("settings.subtitle")} connected>
      <div className="grid gap-6 xl:grid-cols-2">
        {coverage ? <HistorySyncCard coverage={coverage} /> : null}
        {coverage && isDev ? <HistoryDiagnosticCard coverage={coverage} /> : null}

        <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
            <p className="text-sm text-zinc-400">{t("settings.languageDescription")}</p>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>{t("settings.account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>PUUID: {session.puuid}</p>
            <p>{session.gameName}#{session.tagLine}</p>
            <p>{env.enableMockRiot ? "mock/demo" : "riot"}</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>{t("settings.actions")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
              <a href="/api/sync">{t("settings.manualRefresh")}</a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white">
              <a href="/api/auth/logout">{t("settings.logout")}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
