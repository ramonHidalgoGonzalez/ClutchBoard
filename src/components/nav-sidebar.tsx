import Link from "next/link"
import Image from "next/image"

import { Activity, Bot, Compass, LayoutDashboard, Map, Settings, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Activity },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/maps", label: "Maps", icon: Map },
  { href: "/improvement", label: "Mejora", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function NavSidebar({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <aside
      className={cn(
        "w-72 border-r border-white/10 bg-black/30 px-5 py-6 backdrop-blur",
        mobile ? "block h-full" : "hidden xl:block",
      )}
    >
      <div className="mb-8 space-y-3">
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
          Riot-compliant tracker
        </Badge>
        <div className="flex items-start gap-3">
          <Image
            src="/brand/clutchboard-mark.svg"
            alt="Clutchboard logo"
            width={40}
            height={40}
            className="rounded-xl"
            priority
          />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Clutchboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Personal Command Center</h2>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-white text-black shadow-[0_0_40px_rgba(255,70,85,0.15)]"
                  : "text-zinc-300 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3 text-sm text-zinc-200">
          <Shield className="size-4 text-emerald-300" />
          Credenciales y tokens solo en servidor
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          La app separa datos oficiales de Riot y métricas derivadas para que el análisis sea explicable.
        </p>
      </div>
    </aside>
  )
}
