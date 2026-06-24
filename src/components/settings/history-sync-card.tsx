"use client"

import { useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { HistoryCoverage } from "@/server/valorant/content/acts"

type SyncResult = {
  ok: boolean
  matchlistReturned: number
  newMatchIds: number
  savedMatches: number
  oldestSyncedMatchDate: string | null
  newestSyncedMatchDate: string | null
  warnings: string[]
}

function fmt(d: string | null) {
  return d ? d.slice(0, 10) : "—"
}

export function HistorySyncCard({ coverage }: { coverage: HistoryCoverage }) {
  const [pending, setPending] = useState<null | "recent" | "all_available">(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actsWithMatches = coverage.actCoverage.filter((a) => a.syncedMatches > 0).length

  async function sync(mode: "recent" | "all_available") {
    setPending(mode)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/valorant/sync-history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult((await res.json()) as SyncResult)
    } catch {
      setError("No se pudo sincronizar ahora. Inténtalo más tarde.")
    } finally {
      setPending(null)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
      <CardHeader>
        <CardTitle>Sincronización de historial</CardTitle>
        <p className="text-sm text-zinc-400">
          Clutchboard solo puede analizar partidas sincronizadas. Sincroniza para completar actos.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-300">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Partidas sincronizadas" value={coverage.normalizedMatchesCount} />
          <Stat label="Actos con partidas" value={actsWithMatches} />
          <Stat label="Sin acto detectado" value={coverage.matchesWithoutAct} />
          <Stat label="Más antigua" value={fmt(coverage.oldestMatchDate)} />
          <Stat label="Más reciente" value={fmt(coverage.newestMatchDate)} />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => sync("recent")}
            disabled={pending !== null}
            className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]"
          >
            {pending === "recent" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Sincronizar recientes
          </Button>
          <Button
            type="button"
            onClick={() => sync("all_available")}
            disabled={pending !== null}
            variant="outline"
            className="rounded-2xl border-white/10 bg-white/5 text-white"
          >
            {pending === "all_available" ? <Loader2 className="size-4 animate-spin" /> : null}
            Sincronizar más historial
          </Button>
        </div>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {result ? (
          <div className="space-y-1 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2">
            <p className="text-emerald-300">Se han sincronizado {result.savedMatches} nuevas partidas.</p>
            <p className="text-xs text-zinc-400">
              Matchlist de Riot: {result.matchlistReturned} · nuevas detectadas: {result.newMatchIds}
            </p>
            {result.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-300/90">
                {w}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
