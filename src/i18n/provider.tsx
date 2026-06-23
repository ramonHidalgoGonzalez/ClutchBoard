"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"

import type { Dictionary } from "@/i18n/dictionaries"
import { defaultLocale, type Locale } from "@/i18n/locales"
import { es } from "@/i18n/dictionaries/es"
import { makeT, type TFunction } from "@/i18n/translate"

type I18nValue = { locale: Locale; dictionary: Dictionary }

const I18nContext = createContext<I18nValue>({ locale: defaultLocale, dictionary: es })

export function I18nProvider({ locale, dictionary, children }: I18nValue & { children: ReactNode }) {
  const value = useMemo(() => ({ locale, dictionary }), [locale, dictionary])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslations(): TFunction {
  const { dictionary } = useContext(I18nContext)
  return useMemo(() => makeT(dictionary), [dictionary])
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale
}
