import type { TFunction } from "@/i18n/translate"
import { Card, CardContent } from "@/components/ui/card"
import type { TrainingTask } from "@/server/valorant/analytics/improvement-insights"

import { tx } from "./localize"

export function TrainThisWeek({ t, tasks }: { t: TFunction; tasks: TrainingTask[] }) {
  if (!tasks.length) return null
  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("improvement.trainTitle")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {tasks.map((task, i) => (
            <div key={task.id} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-600/90 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-zinc-200">{tx(t, task.text)}</p>
                <p className="mt-2 inline-flex rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  {t("improvement.focusLabel")}: {tx(t, task.focus)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
