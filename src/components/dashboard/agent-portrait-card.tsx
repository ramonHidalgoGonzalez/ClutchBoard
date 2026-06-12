import type { AgentBreakdown } from "@/types/domain"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function AgentPortraitCard({ agent }: { agent: AgentBreakdown }) {
  return (
    <Card className="glass-panel text-white">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center gap-3">
          <AgentAvatar name={agent.agentName} imageUrl={agent.agentImageUrl} iconUrl={agent.agentIconUrl} size="lg" />
          <div>
            <p className="text-lg font-semibold">{agent.agentName || "Unknown Agent"}</p>
            <p className="text-xs text-zinc-400">{agent.matches} partidas</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <Metric label="WR" value={`${agent.winRate.toFixed(1)}%`} />
          <Metric label="KDA" value={agent.kda.toFixed(2)} />
          <Metric label="ACS" value={agent.avgAcs.toFixed(0)} />
        </div>

        <div className="flex flex-wrap gap-2">
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
    <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
