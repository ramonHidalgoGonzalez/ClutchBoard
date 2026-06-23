import { es, type Dictionary } from "./dictionaries/es"

function getPath(obj: unknown, path: string): string | undefined {
  let current: unknown = obj
  for (const part of path.split(".")) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof current === "string" ? current : undefined
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string

/** Build a translator: dot-path lookup, Spanish fallback, then the raw key. */
export function makeT(dict: Dictionary): TFunction {
  return (key, vars) => {
    let value = getPath(dict, key) ?? getPath(es, key)
    if (value === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing key: ${key}`)
      }
      return key
    }
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v))
      }
    }
    return value
  }
}
