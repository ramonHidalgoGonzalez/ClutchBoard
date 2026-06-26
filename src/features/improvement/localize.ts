import type { TFunction } from "@/i18n/translate"
import type { ImprovementSeverity, LocalizedText, TrendDir } from "@/server/valorant/analytics/improvement-insights"

/** Resolve a translatable descriptor against the active locale. */
export function tx(t: TFunction, text: LocalizedText): string {
  return t(text.key, text.params)
}

export function severityLabelKey(severity: ImprovementSeverity): string {
  return `improvement.severity.${severity}`
}

/** Pill classes per severity (high = alert, medium = caution, low = calm). */
export function severityBadgeClass(severity: ImprovementSeverity): string {
  switch (severity) {
    case "high":
      return "border-rose-500/30 bg-rose-500/15 text-rose-200"
    case "medium":
      return "border-amber-500/30 bg-amber-500/15 text-amber-200"
    default:
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
  }
}

export function severityAccent(severity: ImprovementSeverity): string {
  switch (severity) {
    case "high":
      return "text-rose-300"
    case "medium":
      return "text-amber-300"
    default:
      return "text-emerald-300"
  }
}

export function severityBar(severity: ImprovementSeverity): string {
  switch (severity) {
    case "high":
      return "from-rose-500/60"
    case "medium":
      return "from-amber-500/60"
    default:
      return "from-emerald-500/60"
  }
}

export function toneClass(tone: "good" | "bad" | "neutral"): string {
  if (tone === "good") return "text-emerald-300"
  if (tone === "bad") return "text-rose-300"
  return "text-zinc-200"
}

export function trendArrow(direction: TrendDir): string {
  if (direction === "up") return "↗"
  if (direction === "down") return "↘"
  return "→"
}

export function trendToneClass(direction: TrendDir): string {
  if (direction === "up") return "text-emerald-300"
  if (direction === "down") return "text-rose-300"
  return "text-zinc-400"
}

export function formatDelta(delta: number, digits = 0): string {
  const sign = delta > 0 ? "+" : ""
  const f = 10 ** digits
  return `${sign}${Math.round(delta * f) / f}`
}
