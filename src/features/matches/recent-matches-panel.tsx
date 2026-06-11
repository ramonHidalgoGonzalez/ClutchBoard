"use client"

import { useQuery } from "@tanstack/react-query"

import { MatchTable } from "@/features/matches/match-table"
import type { MatchPerformance } from "@/types/domain"

type MatchesResponse = {
  authenticated: boolean
  account: {
    puuid: string
    gameName: string
    tagLine: string
  }
  matches: MatchPerformance[]
}

type MatchesApiError = {
  error?: string
  status?: number
  message?: string
}

async function fetchRecentMatches() {
  const response = await fetch("/api/valorant/matches?limit=10", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as MatchesApiError | null
    if (body?.error === "riot_match_fetch_failed") {
      throw new Error(
        "No se pudieron cargar las partidas. Riot devolvio un error al consultar VAL-MATCH-V1. Tu cuenta esta conectada correctamente.",
      )
    }

    throw new Error(body?.message ?? "No se pudieron cargar las partidas")
  }

  return response.json() as Promise<MatchesResponse>
}

export function RecentMatchesPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["valorant-recent-matches"],
    queryFn: fetchRecentMatches,
  })

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Cargando partidas reales de VALORANT...</p>
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-100">
        {error instanceof Error ? error.message : "Error cargando partidas"}
      </div>
    )
  }

  if (!data || data.matches.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-zinc-300">
        No hay partidas recientes para esta cuenta todavia.
      </div>
    )
  }

  return <MatchTable matches={data.matches} />
}
