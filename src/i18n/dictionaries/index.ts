import type { Locale } from "@/i18n/locales"

import { de } from "./de"
import { en } from "./en"
import { es, type Dictionary } from "./es"
import { fr } from "./fr"
import { pt } from "./pt"

export const dictionaries: Record<Locale, Dictionary> = { es, en, pt, fr, de }

export function getDictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale] ?? es
}

export type { Dictionary }
