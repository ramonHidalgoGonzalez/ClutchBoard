import Link from "next/link"
import Image from "next/image"

import {
  BarChart3,
  Bot,
  Crown,
  LayoutDashboard,
  Map as MapIcon,
  NotebookPen,
  Settings,
  Swords,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { cn } from "@/lib/utils"

const primaryItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/maps", label: "Maps", icon: MapIcon },
  { href: "/improvement", label: "Improvement", icon: TrendingUp },
  { href: "/comparisons", label: "Comparativas", icon: BarChart3 },
  { href: "/ranked", label: "Ranked", icon: Trophy },
  { href: "/notas", label: "Notas de partida", icon: NotebookPen },
]

const secondaryItems = [{ href: "/settings", label: "Configuración", icon: Settings }]

type NavSidebarProps = {
  pathname: string
  mobile?: boolean
  profile?: { name: string; connected: boolean }
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLink({ pathname, href, label, icon: Icon }: { pathname: string; href: string; label: string; icon: typeof Bot }) {
  const active = isActive(pathname, href)
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active
          ? "bg-rose-600/90 text-white shadow-[0_8px_24px_rgba(244,63,94,0.35)]"
          : "text-zinc-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  )
}

export function NavSidebar({ pathname, mobile = false, profile }: NavSidebarProps) {
  const initial = (profile?.name ?? "?").charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        "flex w-72 flex-col border-r border-white/10 bg-black/40 px-4 py-5 backdrop-blur",
        mobile ? "h-full" : "hidden xl:flex",
      )}
    >
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
        <Image
          src="/brand/clutchboard-mark.svg"
          alt="ClutchBoard"
          width={36}
          height={36}
          priority
          className="rounded-xl shadow-[0_8px_24px_rgba(244,63,94,0.35)]"
        />
        <span className="text-lg font-extrabold tracking-tight text-white">
          CLUTCH<span className="text-rose-500">BOARD</span>
        </span>
      </Link>

      {/* Profile */}
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[radial-gradient(circle_at_top,#fb7185,transparent_60%),linear-gradient(135deg,#1e293b,#0ea5e9)] text-base font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{profile?.name ?? "Invitado"}</p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className={cn(
                "size-1.5 rounded-full",
                profile?.connected ? "bg-emerald-400" : "bg-zinc-500",
              )}
            />
            {profile?.connected ? "Conectado a Riot" : "Sin conexión"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 space-y-1">
        {primaryItems.map((item) => (
          <NavLink key={item.href} pathname={pathname} {...item} />
        ))}
        <div className="my-3 border-t border-white/10" />
        {secondaryItems.map((item) => (
          <NavLink key={item.href} pathname={pathname} {...item} />
        ))}
      </nav>

      {/* Premium */}
      <div className="mt-auto rounded-2xl border border-rose-500/20 bg-[linear-gradient(160deg,rgba(244,63,94,0.12),rgba(0,0,0,0.2))] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Crown className="size-4 text-amber-300" /> Premium
        </div>
        <p className="mt-1 text-xs text-zinc-400">Desbloquea análisis avanzados y mucho más.</p>
        <Link
          href="/settings"
          className="mt-3 block rounded-xl bg-rose-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Ver planes
        </Link>
      </div>
    </aside>
  )
}
