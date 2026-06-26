import Link from "next/link"
import { Activity, ArrowRight, Bot, Crosshair, Map as MapIcon, Skull, Target, TrendingDown } from "lucide-react"

import type { TFunction } from "@/i18n/translate"
import { cn } from "@/lib/utils"
import type { ImprovementInsight, ImprovementInsightType, InsightLink } from "@/server/valorant/analytics/improvement-insights"

import { severityBadgeClass, severityAccent, severityBar, severityLabelKey, tx } from "./localize"

const ICONS: Record<ImprovementInsightType, typeof Skull> = {
  early_deaths: Skull,
  combat: Crosshair,
  low_impact_losses: Target,
  consistency: Activity,
  agents: Bot,
  maps: MapIcon,
  ranked_progression: TrendingDown,
  best_strengths: Target,
}

function linkHref(link: InsightLink): string {
  if (link.kind === "agent") return `/agents/${link.slug}`
  if (link.kind === "map") return `/maps/${link.slug}`
  return "/matches"
}

function linkLabelKey(link: InsightLink): string {
  return `improvement.link.${link.kind}`
}

function PriorityCard({ t, insight, rank }: { t: TFunction; insight: ImprovementInsight; rank: number }) {
  const Icon = ICONS[insight.type] ?? Target
  return (
    <article className="premium-card relative flex h-full flex-col overflow-hidden p-5">
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", severityBar(insight.severity))} />
      <header className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {t("improvement.priorityN", { n: rank })}
        </p>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", severityBadgeClass(insight.severity))}>
          {t(severityLabelKey(insight.severity))}
        </span>
      </header>

      <div className="mt-3 flex items-start gap-3">
        <span className={cn("mt-0.5 shrink-0", severityAccent(insight.severity))}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-white">{tx(t, insight.title)}</h3>
          <p className="mt-1 text-sm text-zinc-400">{tx(t, insight.description)}</p>
        </div>
      </div>

      {insight.evidence.length ? (
        <div className="mt-4 flex flex-wrap gap-4">
          {insight.evidence.slice(0, 3).map((ev, i) => (
            <div key={i} className="min-w-0">
              <p className="text-xl font-extrabold text-white">{ev.value}</p>
              <p className="truncate text-[10px] uppercase tracking-wide text-zinc-500">{tx(t, ev.label)}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {t("improvement.recommendation")}
        </p>
        <p className="mt-1 text-sm text-zinc-200">{tx(t, insight.recommendation)}</p>
      </div>

      {insight.link ? (
        <Link
          href={linkHref(insight.link)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-rose-300 transition hover:text-rose-200"
        >
          {t(linkLabelKey(insight.link))}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </article>
  )
}

export function PriorityCards({ t, priorities }: { t: TFunction; priorities: ImprovementInsight[] }) {
  if (!priorities.length) return null
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {t("improvement.prioritiesTitle")}
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {priorities.map((insight, i) => (
          <PriorityCard key={insight.id} t={t} insight={insight} rank={i + 1} />
        ))}
      </div>
    </section>
  )
}
