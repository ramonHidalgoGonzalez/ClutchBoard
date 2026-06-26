import Link from "next/link"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TFunction } from "@/i18n/translate"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import type { AgentProblem } from "@/server/valorant/analytics/improvement-insights"

import { tx } from "./localize"

function winrateClass(winRate: number) {
  if (winRate >= 55) return "text-emerald-300"
  if (winRate >= 48) return "text-zinc-200"
  return "text-rose-300"
}

export function AgentProblems({ t, rows }: { t: TFunction; rows: AgentProblem[] }) {
  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">{t("improvement.agentProblemsTitle")}</h2>

        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("improvement.noEntityData")}</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-zinc-500">
                    <th className="pb-2 font-medium">{t("improvement.col.agent")}</th>
                    <th className="pb-2 text-center font-medium">{t("improvement.col.matches")}</th>
                    <th className="pb-2 text-center font-medium">{t("improvement.col.winrate")}</th>
                    <th className="pb-2 text-center font-medium">{t("improvement.col.kd")}</th>
                    <th className="pb-2 text-center font-medium">{t("improvement.col.acs")}</th>
                    <th className="pb-2 font-medium">{t("improvement.col.worstMap")}</th>
                    <th className="pb-2 font-medium">{t("improvement.col.recommendation")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.slug} className="border-t border-white/5">
                      <td className="py-2.5">
                        <Link href={`/agents/${row.slug}`} className="flex items-center gap-2.5">
                          <AgentAvatar name={row.agentName} imageUrl={getAgentAssets(row.agentName).table} size="sm" framing="avatar" />
                          <span className="font-medium text-white">{row.agentName}</span>
                        </Link>
                      </td>
                      <td className="text-center text-zinc-300">{row.matches}</td>
                      <td className={cn("text-center font-semibold", winrateClass(row.winRate))}>{row.winRate}%</td>
                      <td className="text-center text-zinc-300">{row.kd.toFixed(2)}</td>
                      <td className="text-center text-zinc-300">{row.acs}</td>
                      <td className="text-zinc-300">{row.worstMap ?? "—"}</td>
                      <td className="text-zinc-300">{tx(t, row.recommendation)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2.5 md:hidden">
              {rows.map((row) => (
                <Link key={row.slug} href={`/agents/${row.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center gap-3">
                    <AgentAvatar name={row.agentName} imageUrl={getAgentAssets(row.agentName).table} size="sm" framing="avatar" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-white">{row.agentName}</p>
                      <p className="text-xs text-zinc-500">{t("improvement.nMatches", { n: row.matches })}</p>
                    </div>
                    <span className={cn("text-sm font-semibold", winrateClass(row.winRate))}>{row.winRate}%</span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-400">
                    <span>K/D {row.kd.toFixed(2)}</span>
                    <span>ACS {row.acs}</span>
                    {row.worstMap ? <span>{t("improvement.col.worstMap")}: {row.worstMap}</span> : null}
                  </div>
                  <p className="mt-2 text-xs text-zinc-300">{tx(t, row.recommendation)}</p>
                </Link>
              ))}
            </div>
          </>
        )}
        <Link href="/agents" className="inline-block pt-1 text-sm font-semibold text-rose-300 hover:text-rose-200">
          {t("improvement.viewAllAgents")} →
        </Link>
      </CardContent>
    </Card>
  )
}
