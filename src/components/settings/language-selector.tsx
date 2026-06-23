"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Languages } from "lucide-react"

import { getDictionaryFor } from "@/i18n/dictionaries"
import { localeLabels, supportedLocales, type Locale } from "@/i18n/locales"
import { persistLocale } from "@/i18n/persist-locale"
import { useLocale } from "@/i18n/provider"
import { cn } from "@/lib/utils"

export function LanguageSelector() {
  const current = useLocale()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Locale>(current)
  const [toast, setToast] = useState<string | null>(null)

  function changeLanguage(locale: Locale) {
    setSelected(locale)
    persistLocale(locale)
    setToast(getDictionaryFor(locale).settings.languageUpdated)
    startTransition(() => router.refresh())
    window.setTimeout(() => setToast(null), 2500)
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {supportedLocales.map((locale) => {
          const active = selected === locale
          return (
            <button
              key={locale}
              type="button"
              onClick={() => changeLanguage(locale)}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                active
                  ? "border-rose-500/40 bg-rose-500/15 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2">
                <Languages className="size-4 text-rose-300" />
                <span className="font-medium">{localeLabels[locale]}</span>
                <span className="text-xs uppercase text-zinc-500">{locale}</span>
              </span>
              {active ? <Check className="size-4 text-emerald-300" /> : null}
            </button>
          )
        })}
      </div>
      {toast ? (
        <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {toast}
        </p>
      ) : null}
    </div>
  )
}
