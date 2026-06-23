import { LOCALE_COOKIE, type Locale } from "@/i18n/locales"

/** Persist the chosen locale (cookie is the server source of truth). */
export function persistLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale)
  } catch {
    // localStorage may be unavailable (private mode)
  }
}
