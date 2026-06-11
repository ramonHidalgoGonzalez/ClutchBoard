"use client"

import { useQuery } from "@tanstack/react-query"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { LoadingSkeleton } from "@/components/dashboard/loading-skeleton"
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

class MatchesRequestError extends Error {
  constructor(
    message: string,
    public technicalDetails?: string,
  ) {
    super(message)
  }
}

async function fetchRecentMatches() {
  const response = await fetch("/api/valorant/matches?limit=10", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as MatchesApiError | null
    if (body?.error === "riot_match_fetch_failed") {
      throw new MatchesRequestError(
        "No se pudieron cargar las partidas. Riot devolvio un error al consultar VAL-MATCH-V1. Tu cuenta esta conectada correctamente.",
        body?.message,
      )
    }

    throw new MatchesRequestError(body?.message ?? "No se pudieron cargar las partidas", body?.message)
  }

  return response.json() as Promise<MatchesResponse>
}

export function RecentMatchesPanel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["valorant-recent-matches"],
    queryFn: fetchRecentMatches,
  })

  if (isLoading) {
    return <LoadingSkeleton rows={5} />
  }

  if (error) {
    const technicalDetails = error instanceof MatchesRequestError ? error.technicalDetails : undefined

    return (
      <ErrorState
        title="No se pudieron cargar las partidas."
        description={error instanceof Error ? error.message : "Error cargando partidas"}
        technicalDetails={technicalDetails}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  if (!data || data.matches.length === 0) {
    return (
      <EmptyState
        title="No hay partidas recientes todavia"
        description="En cuanto Riot registre nuevas partidas para esta cuenta, apareceran aqui automaticamente."
      />
    )
  }

  return <MatchTable matches={data.matches} />
}
