import type { ReactNode } from "react"

import { headers } from "next/headers"

import { NavSidebar } from "@/components/nav-sidebar"
import { Topbar } from "@/components/topbar"

export async function AppShell({
  children,
  title,
  subtitle,
  connected = true,
  lastSyncedAt,
}: {
  children: ReactNode
  title: string
  subtitle: string
  connected?: boolean
  lastSyncedAt?: string
}) {
  const pathname = (await headers()).get("x-pathname") ?? "/dashboard"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_12%,rgba(255,94,98,0.22),transparent_30%),radial-gradient(circle_at_86%_4%,rgba(56,189,248,0.12),transparent_26%),linear-gradient(180deg,#07070a_0%,#0b1020_52%,#060811_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <NavSidebar pathname={pathname} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            pathname={pathname}
            connected={connected}
            lastSyncedAt={lastSyncedAt}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
