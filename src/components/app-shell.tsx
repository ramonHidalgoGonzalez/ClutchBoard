import type { ReactNode } from "react"

import { headers } from "next/headers"
import Link from "next/link"

import { NavSidebar } from "@/components/nav-sidebar"
import { Button } from "@/components/ui/button"

export async function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle: string
}) {
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.18),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_55%,#050816_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <NavSidebar pathname={pathname} />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">{title}</p>
              <h1 className="mt-2 text-2xl font-semibold">{subtitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                <Link href="/settings">Settings</Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
