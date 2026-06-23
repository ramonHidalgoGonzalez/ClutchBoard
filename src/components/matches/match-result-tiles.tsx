import Link from "next/link"

import type { MatchPerformance } from "@/types/domain"

function resultLabel(outcome: MatchPerformance["outcome"]) {
  if (outcome === "win") {
    return { text: "VICTORIA", tone: "text-emerald-400", edge: "border-l-emerald-400" }
  }
  if (outcome === "loss") {
    return { text: "DERROTA", tone: "text-rose-400", edge: "border-l-rose-400" }
  }
  if (outcome === "draw") {
    return { text: "EMPATE", tone: "text-sky-300", edge: "border-l-sky-300" }
  }
  return { text: "—", tone: "text-zinc-300", edge: "border-l-zinc-500" }
}

/**
 * Horizontal strip of recent matches, each tile backgrounded by the agent
 * portrait (agent view) or map splash (map view). Used on detail pages.
 */
export function MatchResultTiles({
  matches,
  background,
}: {
  matches: MatchPerformance[]
  background: "agent" | "map"
}) {
  if (!matches.length) {
    return <p className="text-sm text-zinc-500">Sin partidas recientes.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {matches.map((match) => {
        const result = resultLabel(match.outcome)
        const bg = background === "agent" ? match.agentImageUrl : match.mapImageUrl

        return (
          <Link
            key={match.matchId}
            href={`/matches/${match.matchId}`}
            className={`relative overflow-hidden rounded-2xl border border-white/10 border-l-2 ${result.edge} bg-black/30 p-3`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={bg ? { backgroundImage: `url(${bg})` } : undefined}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.55),rgba(9,9,11,0.9))]" aria-hidden="true" />
            <div className="relative">
              <p className={`text-xs font-bold tracking-wide ${result.tone}`}>{result.text}</p>
              <p className="mt-1 text-lg font-bold text-white">
                {match.roundsWon ?? 0} - {match.roundsLost ?? 0}
              </p>
              <p className="mt-2 text-xs text-zinc-300">
                KDA {match.kills ?? 0} / {match.deaths ?? 0} / {match.assists ?? 0}
              </p>
              <p className="text-xs text-zinc-400">ACS {match.acsEstimate ?? "--"}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
