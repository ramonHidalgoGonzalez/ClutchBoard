import type { AgentBreakdown } from "@/types/domain"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function AgentPortraitCard({ agent }: { agent: AgentBreakdown }) {
  return (
    <Card className="glass-panel overflow-hidden text-white">
      <CardContent className="relative py-0">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.35),transparent_42%),linear-gradient(135deg,rgba(12,10,9,0.96),rgba(59,130,246,0.28))]" />
        <div className="relative flex items-center gap-4 px-5 pb-4 pt-5">
          <AgentAvatar name={agent.agentName} imageUrl={agent.agentImageUrl} iconUrl={agent.agentIconUrl} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.26em] text-rose-200/70">Agent profile</p>
            <p className="truncate text-xl font-semibold">{agent.agentName || "Unknown Agent"}</p>
            <p className="text-xs text-zinc-300">{agent.matches} partidas registradas</p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-2 px-5 pb-4 text-sm">
          <Metric label="WR" value={`${agent.winRate.toFixed(1)}%`} />
          <Metric label="KDA" value={agent.kda.toFixed(2)} />
          <Metric label="ACS" value={agent.avgAcs.toFixed(0)} />
        </div>

        <div className="relative flex flex-wrap gap-2 px-5 pb-5">
          {agent.comfortPick ? <Badge className="bg-emerald-500/20 text-emerald-100">comfort pick</Badge> : null}
          {agent.needsWork ? <Badge className="bg-amber-500/20 text-amber-100">needs work</Badge> : null}
          {(agent.sampleSize ?? 0) < 4 ? <Badge className="bg-zinc-500/20 text-zinc-100">muestra pequena</Badge> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
