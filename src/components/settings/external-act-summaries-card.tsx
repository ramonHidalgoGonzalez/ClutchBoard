"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  parseExternalActCsv,
  SOURCE_BADGE,
  validateExternalActInput,
  type ExternalActInput,
  type ExternalActSummary,
} from "@/server/valorant/analytics/external-act-summaries"

const FIELDS: Array<{ key: keyof ExternalActInput; label: string }> = [
  { key: "actLabel", label: "Acto" },
  { key: "sourceName", label: "Fuente" },
  { key: "finalRank", label: "Rango final" },
  { key: "peakRank", label: "Peak rank" },
  { key: "matchesPlayed", label: "Partidas" },
  { key: "wins", label: "Victorias" },
  { key: "losses", label: "Derrotas" },
  { key: "winRate", label: "Winrate" },
  { key: "kda", label: "KDA" },
  { key: "avgCombatScore", label: "ACS" },
  { key: "headshotPercent", label: "HS%" },
  { key: "mainAgent", label: "Agente principal" },
  { key: "bestMap", label: "Mejor mapa" },
  { key: "worstMap", label: "Peor mapa" },
  { key: "notes", label: "Notas" },
]

const EMPTY: Record<string, string> = {}

export function ExternalActSummariesCard({ initial }: { initial: ExternalActSummary[] }) {
  const [summaries, setSummaries] = useState(initial)
  const [form, setForm] = useState<Record<string, string>>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [csv, setCsv] = useState("")
  const [preview, setPreview] = useState<ExternalActInput[] | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setForm(EMPTY)
    setEditingId(null)
    setErrors([])
  }

  async function save() {
    setErrors([])
    const validation = validateExternalActInput(form)
    if (!validation.ok) {
      setErrors(validation.errors)
      return
    }
    setBusy(true)
    try {
      const url = editingId
        ? `/api/valorant/external-act-summaries/${editingId}`
        : "/api/valorant/external-act-summaries"
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation.value),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors(data.errors ?? ["No se pudo guardar."])
        return
      }
      const { summary } = (await res.json()) as { summary: ExternalActSummary }
      setSummaries((prev) => {
        const without = prev.filter((s) => s.id !== summary.id)
        return [...without, summary].sort((a, b) => a.actLabel.localeCompare(b.actLabel))
      })
      reset()
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/valorant/external-act-summaries/${id}`, { method: "DELETE" })
      if (res.ok) setSummaries((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setBusy(false)
    }
  }

  function startEdit(s: ExternalActSummary) {
    const next: Record<string, string> = {}
    for (const { key } of FIELDS) {
      const v = s[key]
      next[key] = v === null || v === undefined ? "" : String(v)
    }
    setForm(next)
    setEditingId(s.id)
    setErrors([])
  }

  function runPreview() {
    const result = parseExternalActCsv(csv)
    setErrors(result.errors)
    setPreview(result.rows)
  }

  async function confirmImport() {
    if (!preview?.length) return
    setBusy(true)
    try {
      const created: ExternalActSummary[] = []
      for (const row of preview) {
        const res = await fetch("/api/valorant/external-act-summaries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(row),
        })
        if (res.ok) created.push(((await res.json()) as { summary: ExternalActSummary }).summary)
      }
      setSummaries((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]))
        created.forEach((s) => map.set(s.id, s))
        return [...map.values()].sort((a, b) => a.actLabel.localeCompare(b.actLabel))
      })
      setCsv("")
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
      <CardHeader>
        <CardTitle>Histórico externo por acto</CardTitle>
        <p className="text-sm text-zinc-400">
          Riot no expone todo el historial antiguo por acto. Aquí puedes añadir resúmenes externos o manuales para
          comparar tu progreso entre actos. Estos datos se mostrarán como “Importado/Manual” y no sustituyen las
          partidas reales sincronizadas desde Riot.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm text-zinc-300">
        {summaries.length ? (
          <div className="space-y-2">
            {summaries.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div>
                  <p className="font-semibold text-zinc-100">
                    {s.actLabel}{" "}
                    <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300">
                      {SOURCE_BADGE[s.source] ?? "Manual"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {s.finalRank ?? "—"} · {s.matchesPlayed ?? "—"} partidas · WR {s.winRate ?? "—"}% · KDA{" "}
                    {s.kda ?? "—"} · {s.mainAgent ?? "—"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => startEdit(s)} className="rounded p-1.5 text-zinc-400 hover:text-zinc-100">
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(s.id)} disabled={busy} className="rounded p-1.5 text-zinc-400 hover:text-rose-400">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Aún no hay resúmenes externos. Añade uno o importa un CSV.</p>
        )}

        {/* Form */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-xs text-zinc-400">
              {f.label}
              <input
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-zinc-100"
              />
            </label>
          ))}
        </div>

        {errors.length ? (
          <ul className="space-y-0.5 text-xs text-rose-400">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save} disabled={busy} className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
            <Plus className="size-4" />
            {editingId ? "Guardar cambios" : "Añadir acto"}
          </Button>
          {editingId ? (
            <Button type="button" onClick={reset} variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white">
              Cancelar
            </Button>
          ) : null}
        </div>

        {/* CSV import */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pegar tabla / CSV</p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={4}
            placeholder="actLabel,sourceName,finalRank,peakRank,matchesPlayed,wins,losses,winRate,kda,avgCombatScore,headshotPercent,mainAgent,bestMap,worstMap,notes"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-zinc-100"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={runPreview} variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white">
              <Upload className="size-4" />
              Previsualizar
            </Button>
            {preview?.length ? (
              <Button type="button" onClick={confirmImport} disabled={busy} className="rounded-2xl bg-emerald-600 hover:bg-emerald-500">
                Confirmar importación ({preview.length})
              </Button>
            ) : null}
          </div>
          {preview?.length ? (
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
              {preview.map((r, i) => (
                <p key={i}>
                  {r.actLabel} · {r.sourceName ?? "—"} · {r.finalRank ?? "—"} · {r.matchesPlayed ?? "—"} partidas
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
