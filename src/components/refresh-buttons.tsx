"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCcw, RotateCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n/provider"

export function RefreshButtons() {
  const t = useTranslations()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch("/api/sync", { method: "POST" })
    } catch {
      // best-effort; refresh shows whatever state exists
    } finally {
      setSyncing(false)
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-white/10 disabled:opacity-60"
      >
        <RefreshCcw className={cn("size-4", syncing && "animate-spin")} />
        {t("common.sync")}
      </button>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
      >
        <RotateCw className={cn("size-4", pending && "animate-spin")} />
        {t("common.refresh")}
      </button>
    </div>
  )
}
