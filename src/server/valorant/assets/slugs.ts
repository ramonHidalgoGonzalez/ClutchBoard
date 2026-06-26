function normalize(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

/**
 * Filesystem-safe slug for agent asset filenames (no dashes).
 *   "KAY/O" -> "kayo", "Breach" -> "breach", "Deadlock" -> "deadlock"
 */
export function normalizeAgentSlug(name: string): string {
  return normalize(name)
}

/**
 * Filesystem-safe slug for map asset filenames.
 *   "Haven" -> "haven", "Icebox" -> "icebox", "Pearl" -> "pearl"
 * Also handles internal paths/codenames defensively (last path segment).
 */
// Map codenames -> canonical asset slug (the engine name differs from the
// display name, e.g. Summit ships as "Plummet").
const MAP_SLUG_ALIASES: Record<string, string> = {
  plummet: "summit",
}

export function normalizeMapSlug(name: string): string {
  const last = name.includes("/") ? (name.split("/").filter(Boolean).at(-1) ?? name) : name
  const slug = normalize(last.replace(/\.(png|jpe?g|webp|gif|svg)$/i, ""))
  return MAP_SLUG_ALIASES[slug] ?? slug
}
