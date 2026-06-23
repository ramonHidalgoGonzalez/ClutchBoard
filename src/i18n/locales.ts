export const supportedLocales = ["es", "en", "pt", "fr", "de"] as const

export type Locale = (typeof supportedLocales)[number]

export const defaultLocale: Locale = "es"

export const LOCALE_COOKIE = "clutchboard_locale"

export const localeLabels: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (supportedLocales as readonly string[]).includes(value)
}

/** Normalize any input (cookie, header) to a supported locale, else default. */
export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value
  if (typeof value === "string") {
    const short = value.slice(0, 2).toLowerCase()
    if (isLocale(short)) return short
  }
  return defaultLocale
}
