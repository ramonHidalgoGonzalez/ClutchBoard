"use client"

import { useEffect, useRef, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarRange, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n/provider"

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  serializeScope,
  NO_ACT_ID,
  type AnalyticsScope,
  type ScopeActOption,
} from "@/server/valorant/analytics/scope-filter"

const STORAGE_KEY = "clutchboard_analytics_scope"

function scopeToKey(scope: AnalyticsScope): string {
  if (scope.type === "act") return `act:${scope.actId}`
  if (scope.type === "last_matches") return `last:${scope.count}`
  return scope.type
}

function keyToScope(key: string): AnalyticsScope {
  if (key.startsWith("act:")) return { type: "act", actId: key.slice(4) }
  if (key.startsWith("last:")) return { type: "last_matches", count: Number(key.slice(5)) as 10 | 20 | 50 | 100 }
  if (key === "current_act" || key === "previous_acts" || key === "all" || key === "no_act") return { type: key }
  return { type: "all" }
}

function actOptionKey(actId: string): string {
  return actId === NO_ACT_ID ? "no_act" : `act:${actId}`
}

export function AnalyticsScopeSelector({
  scope,
  acts,
  syncedTotal,
}: {
  scope: AnalyticsScope
  acts: ScopeActOption[]
  syncedTotal: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations()
  const applied = useRef(false)
  const [isPending, startTransition] = useTransition()

  // Restore the last chosen scope when arriving without an explicit one.
  useEffect(() => {
    if (applied.current) return
    applied.current = true
    if (searchParams.get("scope")) return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored && stored !== "all") {
        navigate(keyToScope(stored))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function navigate(next: AnalyticsScope) {
    try {
      window.localStorage.setItem(STORAGE_KEY, scopeToKey(next))
    } catch {
      // ignore
    }
    const params = new URLSearchParams(serializeScope(next))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  return (
    <div className="flex items-center gap-2">
      {isPending ? (
        <Loader2 className="size-4 animate-spin text-sky-400" />
      ) : (
        <CalendarRange className="size-4 text-zinc-500" />
      )}
      <Select value={scopeToKey(scope)} onValueChange={(v) => navigate(keyToScope(v))}>
        <SelectTrigger
          className={cn(
            "w-56 border-white/15 bg-black/30 text-zinc-100 transition-opacity",
            isPending && "opacity-60",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current_act">{t("scope.currentAct")}</SelectItem>
          <SelectItem value="all">{t("scope.allSynced")}</SelectItem>
          <SelectItem value="previous_acts">{t("scope.previousActs")}</SelectItem>
          <SelectSeparator />
          <SelectItem value="last:10">{t("scope.lastN", { n: 10 })}</SelectItem>
          <SelectItem value="last:20">{t("scope.lastN", { n: 20 })}</SelectItem>
          <SelectItem value="last:50">{t("scope.lastN", { n: 50 })}</SelectItem>
          <SelectItem value="last:100">{t("scope.lastN", { n: 100 })}</SelectItem>
          {acts.length ? <SelectSeparator /> : null}
          {acts.map((a) => (
            <SelectItem key={a.actId} value={actOptionKey(a.actId)}>
              {a.label}
              {a.isCurrent ? ` · ${t("scope.current")}` : ""}
              {a.actId === NO_ACT_ID ? ` (${a.games})` : a.games > 0 ? ` (${a.games})` : ` · ${t("scope.noSync")}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden text-xs text-zinc-500 sm:inline">{t("scope.syncedTotal", { n: syncedTotal })}</span>
    </div>
  )
}
