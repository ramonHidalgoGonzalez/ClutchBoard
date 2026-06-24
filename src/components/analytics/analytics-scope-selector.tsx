"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarRange, Eye, EyeOff, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n/provider"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  serializeScope,
  normalizeRiotId,
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
  const [showEmpty, setShowEmpty] = useState(false)

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

  // The currently selected act stays visible even if it has 0 matches, so the
  // trigger never goes blank when you've navigated to an (empty) act.
  const selectedActId = scope.type === "act" ? normalizeRiotId(scope.actId) : null
  const isVisible = (a: ScopeActOption) =>
    a.games > 0 || a.isCurrent || normalizeRiotId(a.actId) === selectedActId

  const noActOpt = acts.find((a) => a.actId === NO_ACT_ID)
  const realActs = acts.filter((a) => a.actId !== NO_ACT_ID)
  const withGames = realActs.filter(isVisible)
  const withoutGames = realActs.filter((a) => !isVisible(a))

  function countSuffix(a: ScopeActOption) {
    if (a.actId === NO_ACT_ID) return ` · ${t("scope.matchesCount", { n: a.games })}`
    if (a.games > 0) return ` · ${t("scope.matchesCount", { n: a.games })}`
    return ` · ${t("scope.zeroSynced")}`
  }

  function actItem(a: ScopeActOption) {
    return (
      <SelectItem key={a.actId} value={actOptionKey(a.actId)}>
        {a.label}
        {a.isCurrent ? ` · ${t("scope.current")}` : ""}
        {countSuffix(a)}
      </SelectItem>
    )
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
          <SelectGroup>
            <SelectLabel>{t("scope.quick")}</SelectLabel>
            <SelectItem value="current_act">{t("scope.currentAct")}</SelectItem>
            <SelectItem value="all">{t("scope.allSynced")}</SelectItem>
            <SelectItem value="previous_acts">{t("scope.previousActs")}</SelectItem>
            <SelectItem value="last:10">{t("scope.lastN", { n: 10 })}</SelectItem>
            <SelectItem value="last:20">{t("scope.lastN", { n: 20 })}</SelectItem>
            <SelectItem value="last:50">{t("scope.lastN", { n: 50 })}</SelectItem>
            <SelectItem value="last:100">{t("scope.lastN", { n: 100 })}</SelectItem>
          </SelectGroup>

          {withGames.length || noActOpt ? (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{t("scope.withMatches")}</SelectLabel>
                {withGames.map(actItem)}
                {noActOpt ? actItem(noActOpt) : null}
              </SelectGroup>
            </>
          ) : null}

          {showEmpty && withoutGames.length ? (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>{t("scope.withoutMatches")}</SelectLabel>
                {withoutGames.map(actItem)}
                <p className="px-2 py-1.5 text-[11px] leading-snug text-zinc-500">
                  {t("scope.syncHint", { n: syncedTotal })}
                </p>
              </SelectGroup>
            </>
          ) : null}
        </SelectContent>
      </Select>

      {withoutGames.length ? (
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
          title={showEmpty ? t("scope.hideEmpty") : t("scope.showEmpty")}
        >
          {showEmpty ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          <span className="hidden lg:inline">{showEmpty ? t("scope.hideEmpty") : t("scope.showEmpty")}</span>
        </button>
      ) : null}

      <span className="hidden text-xs text-zinc-500 sm:inline">{t("scope.syncedTotal", { n: syncedTotal })}</span>
    </div>
  )
}
