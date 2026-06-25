"use client"

import { useState } from "react"
import { Loader2, Radar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DeepSyncResult = {
  ok: boolean
  queuesScanned: string[]
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
  skippedExisting: number
  rateLimited: boolean
  errors: string[]
}

export function AdvancedSyncCard() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<DeepSyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/valorant/deep-sync-recent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setResult((await res.json()) as DeepSyncResult)
    } catch {
      setError("No se pudo ejecutar el escaneo ahora. Inténtalo más tarde.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
      <CardHeader>
        <CardTitle>Sincronización avanzada</CardTitle>
        <p className="text-sm text-zinc-400">
          Riot no ofrece un historial completo ilimitado por acto. Clutchboard ya guardó las partidas que Riot
          devuelve en tu matchlist. El escaneo avanzado revisa partidas recientes por cola y guarda aquellas donde
          apareces, pero puede no encontrar partidas antiguas.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-300">
        <Button
          type="button"
          onClick={run}
          disabled={pending}
          variant="outline"
          className="rounded-2xl border-white/10 bg-white/5 text-white"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
          Buscar más partidas recientes
        </Button>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {result ? (
          <div className="space-y-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
            <p className="text-zinc-300">Colas revisadas: {result.queuesScanned.join(", ") || "—"}</p>
            <p className="text-zinc-400">Partidas revisadas: {result.matchIdsChecked}</p>
            <p className="text-zinc-400">Detalles descargados: {result.detailsFetched}</p>
            <p className="text-zinc-400">Partidas tuyas encontradas: {result.playerMatchesFound}</p>
            <p className="text-emerald-300">Nuevas guardadas: {result.newMatchesSaved}</p>
            {result.rateLimited ? (
              <p className="text-amber-300/90">Riot limitó la tasa de peticiones; inténtalo de nuevo más tarde.</p>
            ) : null}
            {result.playerMatchesFound === 0 ? (
              <p className="text-zinc-500">
                No se encontraron partidas tuyas en el feed reciente. Esto no es un error: Riot solo expone partidas
                recientes de la plataforma.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
