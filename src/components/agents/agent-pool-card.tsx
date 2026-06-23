import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { LastMatchesStrip } from "@/components/dashboard/last-matches-strip"
import { resolveRole } from "@/components/agents/role-icon"
import { StatPod } from "@/components/stats/stat-pod"
import { WinrateBars } from "@/components/stats/winrate-bars"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  chronological,
  lastN,
  splitDelta,
  summarizeMatches,
  winrateBy,
} from "@/analytics/entity-stats"
import { toSlug } from "@/lib/slug"
import type { AgentBreakdown, MatchPerformance } from "@/types/domain"

function perRoundSeries(matches: MatchPerformance[], pick: (m: MatchPerformance) => number) {
  return chronological(matches).map((m) => {
    const rounds = Math.max(1, (m.roundsWon ?? 0) + (m.roundsLost ?? 0))
    return Number((pick(m) / rounds).toFixed(2))
  })
}

export function AgentPoolCard({
  agent,
  matches,
  role,
  isTop = false,
}: {
  agent: AgentBreakdown
  matches: MatchPerformance[]
  role?: string | null
  isTop?: boolean
}) {
  const summary = summarizeMatches(matches)
  const delta = splitDelta(matches)
  const roleInfo = resolveRole(role)
  const RoleGlyph = roleInfo.icon
  const slug = toSlug(agent.agentName || agent.agentId || "agent")
  const mapRows = winrateBy(matches, (m) => ({
    key: m.mapId || m.mapName,
    name: m.mapName,
    imageUrl: m.mapImageUrl,
    iconUrl: m.mapIconUrl,
  }))

  return (
    <Card className="glass-panel overflow-hidden text-white">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <Link href={`/agents/${slug}`} className="shrink-0">
              <AgentAvatar
                name={agent.agentName}
                imageUrl={agent.agentImageUrl}
                iconUrl={agent.agentIconUrl}
                size="xl"
                className="ring-2 ring-rose-500/50"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={`/agents/${slug}`}
                className="block truncate text-3xl font-extrabold leading-tight hover:text-rose-200"
              >
                {agent.agentName || "Unknown Agent"}
              </Link>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-300">
                <RoleGlyph className="size-4 text-rose-300" />
                <span>{roleInfo.label}</span>
              </div>
              {isTop ? (
                <Badge className="mt-3 border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                  Agente más jugado
                </Badge>
              ) : null}
            </div>
          </div>

          {/* Headline metrics */}
          <div className="grid flex-1 grid-cols-3 gap-3">
            <StatPod label="Partidas" value={String(summary.games)} />
            <StatPod
              label="Winrate"
              value={`${summary.winRate.toFixed(1)}%`}
              delta={delta.available ? delta.winRate : undefined}
              deltaSuffix="%"
            />
            <StatPod
              label="K/D"
              value={summary.kd.toFixed(2)}
              delta={delta.available ? delta.kd : undefined}
            />
          </div>
        </div>

        {/* Secondary stat strip */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-6">
          <StatPod
            label="Kills / R"
            value={summary.killsPerRound.toFixed(2)}
            spark={perRoundSeries(matches, (m) => m.kills ?? 0)}
          />
          <StatPod
            label="Deaths / R"
            value={summary.deathsPerRound.toFixed(2)}
            spark={perRoundSeries(matches, (m) => m.deaths ?? 0)}
          />
          <StatPod
            label="Assists / R"
            value={summary.assistsPerRound.toFixed(2)}
            spark={perRoundSeries(matches, (m) => m.assists ?? 0)}
          />
          <StatPod
            label="ACS"
            value={summary.avgAcs.toFixed(0)}
            delta={delta.available ? delta.acs : undefined}
          />
          <StatPod
            label="HS%"
            value={`${summary.hsPct.toFixed(1)}%`}
            delta={delta.available ? delta.hsPct : undefined}
            deltaSuffix="%"
          />
          <StatPod label="First Bloods" value={String(summary.firstBloods)} />
        </div>

        {/* Recent matches + winrate by map */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-300">Últimas 5 partidas</h4>
              <Link
                href={`/agents/${slug}`}
                className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
              >
                Ver perfil <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <LastMatchesStrip matches={lastN(matches, 5)} />
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-300">Winrate por mapa</h4>
            <WinrateBars rows={mapRows} kind="map" limit={4} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
