import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavSidebar } from "@/components/nav-sidebar"
import { RefreshButtons } from "@/components/refresh-buttons"
import { getTranslations } from "@/i18n/get-dictionary"

type TopbarProps = {
  title: string
  subtitle: string
  pathname: string
  connected?: boolean
  lastSyncedAt?: string
  profile?: { name: string; connected: boolean }
}

function formatLastSync(value?: string) {
  if (!value) {
    return "Sin sincronizar"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Sin sincronizar"
  }

  const now = new Date()
  const time = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
  if (date.toDateString() === now.toDateString()) {
    return `Hoy, ${time}`
  }
  return `${date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}, ${time}`
}

export async function Topbar({ title, subtitle, pathname, connected = true, lastSyncedAt, profile }: TopbarProps) {
  const t = await getTranslations()
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon-sm" variant="outline" className="border-white/15 bg-white/5 text-zinc-100 xl:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-white/10 bg-zinc-950/95 p-0 text-white">
              <NavSidebar pathname={pathname} mobile profile={profile} />
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
            <p className="text-sm text-zinc-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 sm:block">
            <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
              <span className={`size-2 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-500"}`} />
              {connected ? t("common.riotConnected") : t("common.notConnected")}
            </p>
            <p className="text-[11px] text-zinc-500">{t("common.lastUpdate")}: {formatLastSync(lastSyncedAt)}</p>
          </div>
          <RefreshButtons />
        </div>
      </div>
    </header>
  )
}
