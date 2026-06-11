import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MatchPerformance } from "@/types/domain"

export function MatchTable({ matches }: { matches: MatchPerformance[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
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
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.matchId} className="border-white/10 hover:bg-white/5">
              <TableCell className="font-mono text-xs text-zinc-300">
                {match.matchId.length > 10 ? `...${match.matchId.slice(-8)}` : match.matchId}
              </TableCell>
              <TableCell>{new Date(match.startedAt).toLocaleDateString()}</TableCell>
              <TableCell>{match.queueName ?? match.queueId ?? "Unknown Queue"}</TableCell>
              <TableCell>{match.mapName ?? match.mapId ?? "Unknown Map"}</TableCell>
              <TableCell>{match.agentName ?? "Unknown Agent"}</TableCell>
              <TableCell>
                <Badge
                  className={
                    match.outcome === "win"
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-rose-500/15 text-rose-200"
                  }
                >
                  {match.outcome}
                </Badge>
              </TableCell>
              <TableCell>
                {match.kills}/{match.deaths}/{match.assists}
              </TableCell>
              <TableCell>{match.acsEstimate}</TableCell>
              <TableCell>{match.headshotPct.toFixed(1)}%</TableCell>
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
  )
}
