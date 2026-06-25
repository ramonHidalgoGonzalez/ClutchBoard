"use client"

import { useState } from "react"
import { Loader2, Radar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const QUEUES = ["competitive", "unrated", "swiftplay", "spikerush", "deathmatch"]
const DEFAULT_SELECTED = ["competitive", "unrated", "swiftplay"]

type QueueStat = {
  queue: string
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
}

type DeepSyncResult = {
  queuesScanned: string[]
  perQueue: QueueStat[]
  matchIdsChecked: number
  detailsFetched: number
  playerMatchesFound: number
  newMatchesSaved: number
  rateLimited: boolean
  reachedTotalLimit: boolean
}

export function AdvancedSyncCard() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED)
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<DeepSyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggle(queue: string) {
    setSelected((prev) => (prev.includes(queue) ? prev.filter((q) => q !== queue) : [...prev, queue]))
  }

  async function run() {
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/valorant/deep-sync-recent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ queues: selected }),
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
        <div className="flex flex-wrap items-center gap-3">
          {QUEUES.map((q) => (
            <label key={q} className="flex cursor-pointer items-center gap-1.5 text-xs capitalize text-zinc-300">
              <input
                type="checkbox"
                checked={selected.includes(q)}
                onChange={() => toggle(q)}
                className="size-3.5 accent-rose-500"
              />
              {q}
            </label>
          ))}
          <button
            type="button"
            onClick={() => setSelected(selected.length === QUEUES.length ? DEFAULT_SELECTED : QUEUES)}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            {selected.length === QUEUES.length ? "Restablecer" : "Seleccionar todas"}
          </button>
        </div>

        <Button
          type="button"
          onClick={run}
          disabled={pending || selected.length === 0}
          variant="outline"
          className="rounded-2xl border-white/10 bg-white/5 text-white"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
          Buscar más partidas recientes
        </Button>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {result ? (
          <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
            {result.perQueue.map((q) => (
              <p key={q.queue} className="text-zinc-400">
                <span className="capitalize text-zinc-300">{q.queue}</span>: revisadas {q.matchIdsChecked}, descargadas{" "}
                {q.detailsFetched}, tuyas {q.playerMatchesFound}, nuevas {q.newMatchesSaved}
              </p>
            ))}
            <div className="border-t border-white/10 pt-2 text-zinc-400">
              <p>Colas revisadas: {result.queuesScanned.length}</p>
              <p>Partidas revisadas: {result.matchIdsChecked}</p>
              <p>Detalles descargados: {result.detailsFetched}</p>
              <p>Partidas tuyas encontradas: {result.playerMatchesFound}</p>
              <p className="text-emerald-300">Nuevas guardadas: {result.newMatchesSaved}</p>
            </div>
            {result.rateLimited ? (
              <p className="text-amber-300/90">Riot limitó la tasa de peticiones; inténtalo de nuevo más tarde.</p>
            ) : null}
            {result.reachedTotalLimit ? (
              <p className="text-amber-300/90">
                Se alcanzó el límite de detalles antes de revisar todas las colas. Sube el límite o selecciona menos
                colas.
              </p>
            ) : null}
            {result.playerMatchesFound === 0 && !result.rateLimited ? (
              <p className="text-zinc-500">
                No se encontraron partidas tuyas en las colas revisadas. Esto no es un error: Riot solo expone partidas
                recientes globales por cola, no un historial completo antiguo.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
