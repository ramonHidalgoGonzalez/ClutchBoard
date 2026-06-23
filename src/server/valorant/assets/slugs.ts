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
export function normalizeMapSlug(name: string): string {
  const last = name.includes("/") ? (name.split("/").filter(Boolean).at(-1) ?? name) : name
  return normalize(last.replace(/\.(png|jpe?g|webp|gif|svg)$/i, ""))
}
