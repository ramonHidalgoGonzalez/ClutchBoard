import Link from "next/link"

import { AgentBadge } from "@/components/dashboard/agent-badge"
import { KdaBadge } from "@/components/dashboard/kda-badge"
import { MapBadge } from "@/components/dashboard/map-badge"
import { MatchResultBadge } from "@/components/dashboard/match-result-badge"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MatchPerformance } from "@/types/domain"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "--"
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function shortMatchId(matchId: string) {
  return matchId.length > 10 ? `...${matchId.slice(-8)}` : matchId
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) {
    return "--"
  }

  const minutes = Math.round(seconds / 60)
  return `${minutes} min`
}

export function MatchTable({ matches }: { matches: MatchPerformance[] }) {
  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-3xl border border-white/10 bg-white/5 lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Match</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Queue</TableHead>
              <TableHead>Mapa</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>KDA</TableHead>
              <TableHead>ACS</TableHead>
              <TableHead>HS%</TableHead>
              <TableHead>Duracion</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.matchId} className="border-white/10 hover:bg-white/5">
                <TableCell className="font-mono text-xs text-zinc-300">{shortMatchId(match.matchId)}</TableCell>
                <TableCell>{formatDate(match.startedAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-white/15 bg-white/10 text-zinc-100">
                    {match.queueName || match.queueId || "Unknown Queue"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <MapBadge
                    name={match.mapName || match.mapId || "Unknown Map"}
                    imageUrl={match.mapImageUrl}
                    iconUrl={match.mapIconUrl}
                  />
                </TableCell>
                <TableCell>
                  <AgentBadge
                    name={match.agentName || "Unknown Agent"}
                    imageUrl={match.agentImageUrl}
                    iconUrl={match.agentIconUrl}
                  />
                </TableCell>
                <TableCell>
                  <MatchResultBadge outcome={match.outcome || "unknown"} />
                </TableCell>
                <TableCell>
                  <KdaBadge kills={match.kills} deaths={match.deaths} assists={match.assists} />
                </TableCell>
                <TableCell>{Number.isFinite(match.acsEstimate) ? match.acsEstimate : "--"}</TableCell>
                <TableCell>{Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}</TableCell>
                <TableCell>{formatDuration(match.durationSeconds)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/matches/${match.matchId}`} className="text-sm text-rose-300 hover:text-rose-200">
                    Ver detalle
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {matches.map((match) => (
          <article key={match.matchId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-zinc-400">{shortMatchId(match.matchId)}</p>
                <p className="text-sm text-zinc-200">{formatDate(match.startedAt)}</p>
              </div>
              <MatchResultBadge outcome={match.outcome || "unknown"} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-white/15 bg-white/10 text-zinc-100">
                {match.queueName || match.queueId || "Unknown Queue"}
              </Badge>
              <MapBadge
                name={match.mapName || match.mapId || "Unknown Map"}
                imageUrl={match.mapImageUrl}
                iconUrl={match.mapIconUrl}
              />
              <AgentBadge
                name={match.agentName || "Unknown Agent"}
                imageUrl={match.agentImageUrl}
                iconUrl={match.agentIconUrl}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-300">
              <div>
                <p className="text-xs text-zinc-500">KDA</p>
                <KdaBadge kills={match.kills} deaths={match.deaths} assists={match.assists} />
              </div>
              <div>
                <p className="text-xs text-zinc-500">ACS</p>
                <p>{Number.isFinite(match.acsEstimate) ? match.acsEstimate : "--"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">HS%</p>
                <p>{Number.isFinite(match.headshotPct) ? `${match.headshotPct.toFixed(1)}%` : "--"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Duracion</p>
                <p>{formatDuration(match.durationSeconds)}</p>
              </div>
            </div>

            <div className="mt-3 text-right">
              <Link href={`/matches/${match.matchId}`} className="text-sm text-rose-300 hover:text-rose-200">
                Ver detalle
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
