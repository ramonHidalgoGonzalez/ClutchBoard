import type { Locale } from "@/i18n/locales"

const INTL_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-PT",
  fr: "fr-FR",
  de: "de-DE",
}

function intl(locale: Locale) {
  return INTL_LOCALE[locale] ?? "es-ES"
}

export function formatDate(date: string | number | Date, locale: Locale): string {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat(intl(locale), { day: "2-digit", month: "short", year: "numeric" }).format(d)
}

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat(intl(locale), opts).format(value)
}

/** value is 0..100. es/fr/de/pt use a non-breaking space before %, en does not. */
export function formatPercent(value: number, locale: Locale, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return "—"
  const num = formatNumber(value, locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
  const space = locale === "en" ? "" : " "
  return `${num}${space}%`
}

export function formatDuration(seconds: number, locale: Locale): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—"
  const minutes = Math.round(seconds / 60)
  return `${formatNumber(minutes, locale)} min`
}

const QUEUE_LABELS: Record<Locale, Record<string, string>> = {
  es: { competitive: "Competitivo", unrated: "Normal", swiftplay: "Swiftplay", deathmatch: "Deathmatch", spikerush: "Spike Rush", "spike rush": "Spike Rush" },
  en: { competitive: "Competitive", unrated: "Unrated", swiftplay: "Swiftplay", deathmatch: "Deathmatch", spikerush: "Spike Rush", "spike rush": "Spike Rush" },
  pt: { competitive: "Competitiva", unrated: "Normal", swiftplay: "Swiftplay", deathmatch: "Deathmatch", spikerush: "Spike Rush", "spike rush": "Spike Rush" },
  fr: { competitive: "Compétition", unrated: "Non classé", swiftplay: "Swiftplay", deathmatch: "Deathmatch", spikerush: "Spike Rush", "spike rush": "Spike Rush" },
  de: { competitive: "Wettkampf", unrated: "Unbewertet", swiftplay: "Swiftplay", deathmatch: "Deathmatch", spikerush: "Spike Rush", "spike rush": "Spike Rush" },
}

export function formatQueue(queue: string | null | undefined, locale: Locale): string {
  if (!queue) return "—"
  const key = queue.trim().toLowerCase()
  return QUEUE_LABELS[locale]?.[key] ?? QUEUE_LABELS.en[key] ?? queue
}

const RESULT_LABELS: Record<Locale, { win: string; loss: string; draw: string }> = {
  es: { win: "Victoria", loss: "Derrota", draw: "Empate" },
  en: { win: "Victory", loss: "Defeat", draw: "Draw" },
  pt: { win: "Vitória", loss: "Derrota", draw: "Empate" },
  fr: { win: "Victoire", loss: "Défaite", draw: "Égalité" },
  de: { win: "Sieg", loss: "Niederlage", draw: "Unentschieden" },
}

export function formatResult(result: "win" | "loss" | "draw" | "unknown" | string, locale: Locale): string {
  const map = RESULT_LABELS[locale] ?? RESULT_LABELS.es
  if (result === "win" || result === "loss" || result === "draw") return map[result]
  return "—"
}
