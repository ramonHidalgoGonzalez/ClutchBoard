import type { AgentBreakdown, MatchPerformance } from "@/types/domain"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LastMatchesStrip } from "@/components/dashboard/last-matches-strip"
import { WinrateByMap } from "@/components/dashboard/winrate-by-map"

export function AgentPortraitCard({ agent, matches }: { agent: AgentBreakdown; matches?: MatchPerformance[] }) {
  return (
    <Card className="glass-panel overflow-hidden text-white">
      <CardContent className="relative py-0">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.35),transparent_42%),linear-gradient(135deg,rgba(12,10,9,0.96),rgba(59,130,246,0.28))]" />

        <div className="relative flex items-start gap-6 px-5 pb-4 pt-5">
          <AgentAvatar name={agent.agentName} imageUrl={agent.agentImageUrl} iconUrl={agent.agentIconUrl} size="xl" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-rose-200/70">Perfil</p>
                <p className="truncate text-2xl font-semibold">{agent.agentName || "Unknown Agent"}</p>
                <p className="text-xs text-zinc-300">{agent.matches} partidas registradas</p>
              </div>
              <div className="flex gap-2">
                {agent.comfortPick ? <Badge className="bg-emerald-500/20 text-emerald-100">comfort pick</Badge> : null}
                {agent.needsWork ? <Badge className="bg-amber-500/20 text-amber-100">needs work</Badge> : null}
                {(agent.sampleSize ?? 0) < 4 ? <Badge className="bg-zinc-500/20 text-zinc-100">muestra pequena</Badge> : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <Metric label="WR" value={`${agent.winRate.toFixed(1)}%`} className="text-lg" />
              <Metric label="KDA" value={agent.kda.toFixed(2)} className="text-lg" />
              <Metric label="ACS" value={agent.avgAcs.toFixed(0)} className="text-lg" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-zinc-300">Últimas 5 partidas</h4>
              <LastMatchesStrip matches={matches} />
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-zinc-300">Winrate por mapa</h4>
              <WinrateByMap matches={matches} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={"rounded-2xl border border-white/10 bg-black/30 p-3 text-center backdrop-blur-sm " + (className ?? "")}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100 text-lg">{value}</p>
    </div>
  )
}
