/**
 * Pure types, validation and CSV parsing for user-provided act summaries.
 * No Prisma import here so it can run on the client (form/CSV preview) too.
 */

export type ExternalActSource = "manual" | "external_csv" | "external_json" | "tracker_copy"

export type ExternalActInput = {
  actId?: string | null
  actLabel: string
  episodeLabel?: string | null
  actNumber?: string | null
  source?: ExternalActSource
  sourceName?: string | null
  finalRank?: string | null
  peakRank?: string | null
  finalRankTier?: number | null
  peakRankTier?: number | null
  matchesPlayed?: number | null
  wins?: number | null
  losses?: number | null
  winRate?: number | null
  kills?: number | null
  deaths?: number | null
  assists?: number | null
  kda?: number | null
  avgCombatScore?: number | null
  headshotPercent?: number | null
  damageDelta?: number | null
  mainAgent?: string | null
  bestAgent?: string | null
  bestMap?: string | null
  worstMap?: string | null
  notes?: string | null
}

export type ExternalActSummary = ExternalActInput & {
  id: string
  userId: string
  puuid: string
  source: ExternalActSource
  createdAt: string
  updatedAt: string
}

export type ValidationResult =
  | { ok: true; value: ExternalActInput }
  | { ok: false; errors: string[] }

function str(v: unknown): string | null {
  if (typeof v !== "string") return null
  const t = v.trim()
  return t.length ? t : null
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null
  const n = typeof v === "number" ? v : Number(String(v).replace(",", ".").replace("%", "").trim())
  return Number.isFinite(n) ? n : null
}

const SOURCES: ExternalActSource[] = ["manual", "external_csv", "external_json", "tracker_copy"]

/** Validate + sanitize a writable summary. Never trusts client numbers blindly. */
export function validateExternalActInput(raw: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  const actLabel = str(raw.actLabel)
  if (!actLabel) errors.push("El acto (actLabel) es obligatorio.")

  const winRate = num(raw.winRate)
  if (winRate !== null && (winRate < 0 || winRate > 100)) errors.push("winRate debe estar entre 0 y 100.")

  const headshotPercent = num(raw.headshotPercent)
  if (headshotPercent !== null && (headshotPercent < 0 || headshotPercent > 100))
    errors.push("headshotPercent debe estar entre 0 y 100.")

  const matchesPlayed = num(raw.matchesPlayed)
  if (matchesPlayed !== null && matchesPlayed < 0) errors.push("matchesPlayed no puede ser negativo.")

  const wins = num(raw.wins)
  const losses = num(raw.losses)
  if (wins !== null && wins < 0) errors.push("wins no puede ser negativo.")
  if (losses !== null && losses < 0) errors.push("losses no puede ser negativo.")
  if (matchesPlayed !== null && wins !== null && losses !== null && wins + losses > matchesPlayed) {
    errors.push("wins + losses no puede superar matchesPlayed.")
  }

  const source = SOURCES.includes(raw.source as ExternalActSource) ? (raw.source as ExternalActSource) : "manual"

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    value: {
      actLabel: actLabel!,
      actId: str(raw.actId),
      episodeLabel: str(raw.episodeLabel),
      actNumber: str(raw.actNumber),
      source,
      sourceName: str(raw.sourceName),
      finalRank: str(raw.finalRank),
      peakRank: str(raw.peakRank),
      finalRankTier: num(raw.finalRankTier),
      peakRankTier: num(raw.peakRankTier),
      matchesPlayed,
      wins,
      losses,
      winRate,
      kills: num(raw.kills),
      deaths: num(raw.deaths),
      assists: num(raw.assists),
      kda: num(raw.kda),
      avgCombatScore: num(raw.avgCombatScore),
      headshotPercent,
      damageDelta: num(raw.damageDelta),
      mainAgent: str(raw.mainAgent),
      bestAgent: str(raw.bestAgent),
      bestMap: str(raw.bestMap),
      worstMap: str(raw.worstMap),
      notes: str(raw.notes),
    },
  }
}

function splitCsvLine(line: string): string[] {
  // Minimal CSV: handles quoted fields with commas.
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export type CsvParseResult = { rows: ExternalActInput[]; errors: string[] }

/**
 * Parse a pasted CSV (header row required). Each data row is validated; invalid
 * rows are reported and skipped. Imported rows are tagged source=external_csv.
 */
export function parseExternalActCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return { rows: [], errors: ["El CSV necesita una cabecera y al menos una fila."] }

  const header = splitCsvLine(lines[0]).map((h) => h.trim())
  const rows: ExternalActInput[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i])
    const record: Record<string, unknown> = {}
    header.forEach((key, idx) => {
      record[key] = cells[idx] ?? ""
    })
    record.source = "external_csv"
    const result = validateExternalActInput(record)
    if (result.ok) rows.push(result.value)
    else errors.push(`Fila ${i + 1}: ${result.errors.join(" ")}`)
  }

  return { rows, errors }
}

export const SOURCE_BADGE: Record<string, string> = {
  riot: "Riot sincronizado",
  manual: "Manual",
  external_csv: "Importado",
  external_json: "Importado",
  tracker_copy: "Importado",
}
