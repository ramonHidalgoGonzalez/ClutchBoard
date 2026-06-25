"use client"

import { useState } from "react"
import { FileSpreadsheet, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  parseExternalActCsv,
  SOURCE_BADGE,
  validateExternalActInput,
  type ExternalActInput,
  type ExternalActSummary,
} from "@/server/valorant/analytics/external-act-summaries"

type FieldKey = keyof ExternalActInput

const FIELD_GROUPS: Array<{ title: string; fields: Array<{ key: FieldKey; label: string }> }> = [
  {
    title: "Información básica",
    fields: [
      { key: "actLabel", label: "Acto" },
      { key: "sourceName", label: "Fuente" },
      { key: "finalRank", label: "Rango final" },
      { key: "peakRank", label: "Peak rank" },
    ],
  },
  {
    title: "Rendimiento",
    fields: [
      { key: "matchesPlayed", label: "Partidas" },
      { key: "wins", label: "Victorias" },
      { key: "losses", label: "Derrotas" },
      { key: "winRate", label: "Winrate" },
      { key: "kda", label: "KDA" },
      { key: "avgCombatScore", label: "ACS" },
      { key: "headshotPercent", label: "HS%" },
    ],
  },
  {
    title: "Contexto",
    fields: [
      { key: "mainAgent", label: "Agente principal" },
      { key: "bestMap", label: "Mejor mapa" },
      { key: "worstMap", label: "Peor mapa" },
    ],
  },
]

const CSV_PLACEHOLDER =
  "actLabel,sourceName,finalRank,peakRank,matchesPlayed,wins,losses,winRate,kda,avgCombatScore,headshotPercent,mainAgent,bestMap,worstMap,notes"

function badgeClass(source: string): string {
  if (source === "riot") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
  if (source === "manual") return "border-sky-500/30 bg-sky-500/15 text-sky-300"
  return "border-amber-500/30 bg-amber-500/15 text-amber-300"
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 px-2 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-100">{value}</p>
    </div>
  )
}

const val = (v: number | string | null | undefined, suffix = "") =>
  v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`

export function ExternalActSummariesCard({ initial }: { initial: ExternalActSummary[] }) {
  const [summaries, setSummaries] = useState(initial)
  const [form, setForm] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const [manualOpen, setManualOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [csv, setCsv] = useState("")
  const [preview, setPreview] = useState<ExternalActInput[] | null>(null)

  function openCreate() {
    setForm({})
    setEditingId(null)
    setErrors([])
    setManualOpen(true)
  }

  function openEdit(s: ExternalActSummary) {
    const next: Record<string, string> = {}
    for (const group of FIELD_GROUPS) for (const f of group.fields) {
      const v = s[f.key]
      next[f.key] = v === null || v === undefined ? "" : String(v)
    }
    next.notes = s.notes ?? ""
    setForm(next)
    setEditingId(s.id)
    setErrors([])
    setManualOpen(true)
  }

  function upsertLocal(summary: ExternalActSummary) {
    setSummaries((prev) =>
      [...prev.filter((s) => s.id !== summary.id), summary].sort((a, b) => a.actLabel.localeCompare(b.actLabel)),
    )
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
      const url = editingId ? `/api/valorant/external-act-summaries/${editingId}` : "/api/valorant/external-act-summaries"
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
      upsertLocal(((await res.json()) as { summary: ExternalActSummary }).summary)
      setManualOpen(false)
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
      setCsvOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white xl:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Histórico externo por acto</CardTitle>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">
              Añade resúmenes externos o manuales para comparar tu progreso entre actos. Se muestran como
              “Importado/Manual” y no sustituyen las partidas reales sincronizadas desde Riot.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" onClick={openCreate} className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
              <Plus className="size-4" /> Añadir resumen manual
            </Button>
            <Button
              type="button"
              onClick={() => setCsvOpen(true)}
              variant="outline"
              className="rounded-2xl border-white/10 bg-white/5 text-white"
            >
              <FileSpreadsheet className="size-4" /> Importar CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {summaries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/10 px-6 py-10 text-center">
            <FolderPlus className="size-7 text-zinc-500" />
            <p className="text-sm font-semibold text-zinc-200">Todavía no has añadido actos externos</p>
            <p className="max-w-sm text-xs text-zinc-500">
              Guarda resúmenes de actos antiguos (rango, winrate, KDA…) que Riot ya no devuelve, para verlos en la
              progresión por actos y en las comparativas.
            </p>
            <div className="mt-2 flex gap-2">
              <Button type="button" onClick={openCreate} className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
                <Plus className="size-4" /> Añadir resumen manual
              </Button>
              <Button
                type="button"
                onClick={() => setCsvOpen(true)}
                variant="outline"
                className="rounded-2xl border-white/10 bg-white/5 text-white"
              >
                <FileSpreadsheet className="size-4" /> Importar CSV
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {summaries.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{s.actLabel}</p>
                    <p className="text-xs text-zinc-500">
                      {val(s.finalRank)} · peak {val(s.peakRank)} · {val(s.mainAgent)}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${badgeClass(s.source)}`}>
                    {SOURCE_BADGE[s.source] ?? "Manual"}
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <Stat label="Part." value={val(s.matchesPlayed)} />
                  <Stat label="WR" value={val(s.winRate, "%")} />
                  <Stat label="KDA" value={val(s.kda)} />
                  <Stat label="ACS" value={val(s.avgCombatScore)} />
                  <Stat label="HS" value={val(s.headshotPercent, "%")} />
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={busy}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-rose-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Manual form modal */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-white/10 bg-[#0b1020] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar resumen de acto" : "Añadir resumen de acto"}</DialogTitle>
            <DialogDescription>Solo el acto es obligatorio. Deja en blanco lo que no tengas.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {FIELD_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{group.title}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.fields.map((f) => (
                    <label key={f.key} className="text-xs text-zinc-400">
                      {f.label}
                      <Input
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className="mt-1 border-white/10 bg-black/30 text-zinc-100"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <label className="block text-xs text-zinc-400">
              Notas
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100"
              />
            </label>

            {errors.length ? (
              <ul className="space-y-0.5 text-xs text-rose-400">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualOpen(false)}
              className="rounded-2xl border-white/10 bg-white/5 text-white"
            >
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={busy} className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
              {editingId ? "Guardar cambios" : "Añadir acto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV import modal */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="border-white/10 bg-[#0b1020] text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar CSV</DialogTitle>
            <DialogDescription>Pega una tabla con cabecera. Previsualiza antes de confirmar.</DialogDescription>
          </DialogHeader>

          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            placeholder={CSV_PLACEHOLDER}
            className="w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-zinc-100"
          />

          {errors.length ? (
            <ul className="space-y-0.5 text-xs text-rose-400">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}

          {preview?.length ? (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-400">
              {preview.map((r, i) => (
                <p key={i}>
                  {r.actLabel} · {val(r.sourceName)} · {val(r.finalRank)} · {val(r.matchesPlayed)} partidas
                </p>
              ))}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={runPreview}
              className="rounded-2xl border-white/10 bg-white/5 text-white"
            >
              Previsualizar
            </Button>
            <Button
              type="button"
              onClick={confirmImport}
              disabled={busy || !preview?.length}
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-500"
            >
              Confirmar importación{preview?.length ? ` (${preview.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
