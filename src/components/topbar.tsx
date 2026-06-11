import Link from "next/link"

import { Menu, RefreshCcw, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NavSidebar } from "@/components/nav-sidebar"
import { Badge } from "@/components/ui/badge"

type TopbarProps = {
  title: string
  subtitle: string
  pathname: string
  connected?: boolean
  lastSyncedAt?: string
}

function formatLastSync(value?: string) {
  if (!value) {
    return "Sin sincronizar"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Sin sincronizar"
  }

  return date.toLocaleString()
}

export function Topbar({ title, subtitle, pathname, connected = true, lastSyncedAt }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon-sm" variant="outline" className="border-white/15 bg-white/5 text-zinc-100 xl:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-white/10 bg-zinc-950/95 p-0 text-white">
              <NavSidebar pathname={pathname} mobile />
            </SheetContent>
          </Sheet>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{title}</p>
            <h1 className="text-lg font-semibold text-white sm:text-2xl">{subtitle}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right md:block">
            <p className="text-xs text-zinc-300">{connected ? "Riot conectado" : "Sin conexion"}</p>
            <p className="text-[11px] text-zinc-500">{formatLastSync(lastSyncedAt)}</p>
          </div>
          <Badge variant="outline" className="hidden border-emerald-400/30 bg-emerald-500/10 text-emerald-200 md:inline-flex">
            {connected ? "Riot conectado" : "Sin conexion"}
          </Badge>
          <Button variant="outline" className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10">
            <RefreshCcw className="size-4" />
            Sync
          </Button>
          <Button asChild variant="outline" className="border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10">
            <Link href="/settings">
              <Settings className="size-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
