export function normalizeContentKey(value: string) {
  return value.trim().toLowerCase()
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

  return last.replace(/[_-]+/g, " ").trim() || "Unknown Map"
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
