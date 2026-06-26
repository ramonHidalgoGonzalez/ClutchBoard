export function normalizeContentKey(value: string) {
  return value.trim().toLowerCase()
}

// Riot match payloads identify the map by its internal codename/path
// (e.g. "/Game/Maps/Triad/Triad"), not by the display name. The official
// val-content endpoint does not always expose a field we can key on, so we
// translate codenames to canonical names deterministically.
const MAP_CODENAMES: Record<string, string> = {
  ascent: "Ascent",
  duality: "Bind",
  triad: "Haven",
  bonsai: "Split",
  port: "Icebox",
  foxtrot: "Breeze",
  canyon: "Fracture",
  pitt: "Pearl",
  jam: "Lotus",
  juliett: "Sunset",
  juliette: "Sunset",
  infinity: "Abyss",
  plummet: "Summit",
}

// Resolve a map value (display name, codename, or "/Game/Maps/<code>/<code>"
// path) to its canonical display name. Falls back to the cleaned input so
// unknown/newer maps still render a readable label instead of breaking.
export function resolveCanonicalMapName(value: string | null | undefined) {
  if (!value) {
    return "Unknown Map"
  }

  const cleaned = cleanMapName(value)
  return MAP_CODENAMES[normalizeContentKey(cleaned)] ?? cleaned
}

export function cleanMapName(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return "Unknown Map"
  }

  if (!trimmed.includes("/")) {
    return trimmed
  }

  const segments = trimmed.split("/").filter(Boolean)
  const last = segments.at(-1)
  if (!last) {
    return trimmed
  }

  // Drop a trailing image extension (mock catalogs key maps by asset path).
  const withoutExt = last.replace(/\.(png|jpe?g|webp|gif|svg)$/i, "")
  return withoutExt.replace(/[_-]+/g, " ").trim() || "Unknown Map"
}

export function buildMapLookupKeys(...values: Array<string | null | undefined>) {
  const keys = new Set<string>()

  for (const value of values) {
    if (!value) {
      continue
    }

    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }

    keys.add(normalizeContentKey(trimmed))
    keys.add(normalizeContentKey(cleanMapName(trimmed)))
  }

  return Array.from(keys)
}
