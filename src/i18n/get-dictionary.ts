import { cookies, headers } from "next/headers"

import { getDictionaryFor, type Dictionary } from "@/i18n/dictionaries"
import { LOCALE_COOKIE, defaultLocale, normalizeLocale, type Locale } from "@/i18n/locales"
import { makeT, type TFunction } from "@/i18n/translate"

/** Resolve the active locale (cookie → Accept-Language → default). Server only. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (fromCookie) return normalizeLocale(fromCookie)

  try {
    const accept = (await headers()).get("accept-language")
    if (accept) return normalizeLocale(accept.split(",")[0])
  } catch {
    // headers may be unavailable in some contexts
  }
  return defaultLocale
}

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return getDictionaryFor(locale ?? (await getLocale()))
}

/** Server translator bound to the active locale. */
export async function getTranslations(): Promise<TFunction> {
  return makeT(await getDictionary())
}
