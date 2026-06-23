import Link from "next/link"

import { resolveRole } from "@/components/agents/role-icon"
import { Badge } from "@/components/ui/badge"
import { summarizeMatches } from "@/analytics/entity-stats"
import { resolveAgentRole } from "@/lib/agent-roles"
import { toSlug } from "@/lib/slug"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import type { AgentBreakdown, MatchPerformance } from "@/types/domain"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-white">{value}</p>
    </div>
  )
}

export function VisualAgentCard({
  agent,
  matches,
  role,
}: {
  agent: AgentBreakdown
  matches: MatchPerformance[]
  role?: string | null
}) {
  const slug = toSlug(agent.agentName || agent.agentId || "agent")
  const img = getAgentAssets(agent.agentName)
  // Official content has no role → fall back to the static agent→role map.
  const roleLabel = resolveAgentRole(agent.agentName, role)
  const roleInfo = resolveRole(roleLabel ?? "Agente")
  const RoleGlyph = roleInfo.icon
  const summary = summarizeMatches(matches)

  return (
    <Link
      href={`/agents/${slug}`}
      className="premium-card group relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fb718533,transparent_55%),linear-gradient(160deg,#1e293b,#0b1020)]" />
        {img.hero ?? img.card ?? agent.agentImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.hero ?? img.card ?? agent.agentImageUrl ?? undefined}
            alt={agent.agentName}
            className="absolute inset-0 h-full w-full object-cover object-[center_top] transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(9,9,11,0.92))]" />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          {agent.comfortPick ? (
            <Badge className="border-emerald-400/30 bg-emerald-500/20 text-emerald-100">comfort</Badge>
          ) : null}
          {agent.needsWork ? (
            <Badge className="border-amber-400/30 bg-amber-500/20 text-amber-100">a mejorar</Badge>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          <p className="text-2xl font-extrabold text-white">{agent.agentName}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-300">
            <RoleGlyph className="size-3.5 text-rose-300" /> {roleInfo.label}
            <span className="text-zinc-500">·</span> {agent.matches} partidas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        <Stat label="WR" value={`${agent.winRate.toFixed(0)}%`} />
        <Stat label="KDA" value={agent.kda.toFixed(2)} />
        <Stat label="ACS" value={agent.avgAcs.toFixed(0)} />
        <Stat label="HS%" value={`${summary.hsPct.toFixed(0)}%`} />
      </div>
    </Link>
  )
}
