import { NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { normalizeRiotApiError } from "@/integrations/riot/client"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

const PLATFORM_HOSTS = {
  ap: "https://ap.api.riotgames.com",
  br: "https://br.api.riotgames.com",
  esports: "https://esports.api.riotgames.com",
  eu: "https://eu.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  latam: "https://latam.api.riotgames.com",
  na: "https://na.api.riotgames.com",
} as const

function sanitizeMessage(value: unknown) {
  const message = typeof value === "string" ? value : value instanceof Error ? value.message : "unknown"
  return message.replace(/RGAPI-[A-Za-z0-9-]+/g, "RGAPI-REDACTED").slice(0, 300)
}

function resolvePlatform() {
  if (["ap", "br", "esports", "eu", "kr", "latam", "na"].includes(env.riotPlatform)) {
    return env.riotPlatform as keyof typeof PLATFORM_HOSTS
  }

  return "eu"
}

export async function GET() {
  if (!env.isProduction || !env.riotDebugMatchCheck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const platform = resolvePlatform()
  const requestUrl = `${PLATFORM_HOSTS[platform]}/val/match/v1/matchlists/by-puuid/${session.puuid}`
  const authMode = "x-riot-token"
  const apiKeyConfigured = Boolean(env.riotApiKey)
  const apiKeyLength = env.riotApiKey?.length ?? 0
  const apiKeyPrefix = env.riotApiKey ? env.riotApiKey.slice(0, 6) : ""

  let directFetch = {
    ok: false,
    status: 0,
    bodyStatusCode: null as number | null,
    bodyMessage: "not-executed",
    firstMatchId: null as string | null,
  }

  let matchDetailShape = {
    ok: false,
    status: 0,
    message: "not-executed",
    firstPlayer: null as {
      keys: string[]
      characterId: string | null
      characterName: string | null
      gameName: string | null
      tagLine: string | null
      puuidPrefix: string | null
    } | null,
    firstTeam: null as {
      keys: string[]
      teamId: string | null
      won: boolean | null
      roundsPlayed: number | null
      roundsWon: number | null
      numPoints: number | null
      roundsLost: number | null
    } | null,
  }

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "X-Riot-Token": env.riotApiKey ?? "",
      },
      cache: "no-store",
    })

    let bodyStatusCode: number | null = null
    let bodyMessage = ""

    const parsed = await response.json().catch(() => null)
    let firstMatchId: string | null = null
    if (parsed && typeof parsed === "object") {
      const statusObj = (parsed as { status?: { status_code?: number; message?: string } }).status
      bodyStatusCode = statusObj?.status_code ?? null
      bodyMessage = sanitizeMessage(statusObj?.message ?? "")

      const history = (parsed as { history?: unknown[] }).history
      const firstEntry = Array.isArray(history) ? history[0] : null
      if (typeof firstEntry === "string") {
        firstMatchId = firstEntry
      } else if (
        firstEntry &&
        typeof firstEntry === "object" &&
        "matchId" in firstEntry &&
        typeof (firstEntry as { matchId?: unknown }).matchId === "string"
      ) {
        firstMatchId = (firstEntry as { matchId: string }).matchId
      }
    }

    directFetch = {
      ok: response.ok,
      status: response.status,
      bodyStatusCode,
      bodyMessage,
      firstMatchId,
    }

    if (response.ok && firstMatchId) {
      const detailUrl = `${PLATFORM_HOSTS[platform]}/val/match/v1/matches/${firstMatchId}`
      const detail = await fetch(detailUrl, {
        method: "GET",
        headers: {
          "X-Riot-Token": env.riotApiKey ?? "",
        },
        cache: "no-store",
      })

      const detailBody = (await detail.json().catch(() => null)) as
        | {
            players?: Array<{
              characterId?: string | null
              characterName?: string | null
              gameName?: string | null
              tagLine?: string | null
              puuid?: string
              [key: string]: unknown
            }>
            teams?: Array<{
              teamId?: string | null
              won?: boolean | null
              roundsPlayed?: number | null
              roundsWon?: number | null
              numPoints?: number | null
              roundsLost?: number | null
              [key: string]: unknown
            }>
            status?: { message?: string }
          }
        | null

      const firstPlayer = Array.isArray(detailBody?.players) ? detailBody.players[0] : null
      const firstTeam = Array.isArray(detailBody?.teams) ? detailBody.teams[0] : null
      matchDetailShape = {
        ok: detail.ok,
        status: detail.status,
        message: detail.ok ? "detail fetch ok" : sanitizeMessage(detailBody?.status?.message ?? "detail fetch failed"),
        firstPlayer: firstPlayer
          ? {
              keys: Object.keys(firstPlayer),
              characterId: firstPlayer.characterId ?? null,
              characterName: firstPlayer.characterName ?? null,
              gameName: firstPlayer.gameName ?? null,
              tagLine: firstPlayer.tagLine ?? null,
              puuidPrefix: firstPlayer.puuid ? firstPlayer.puuid.slice(0, 8) : null,
            }
          : null,
        firstTeam: firstTeam
          ? {
              keys: Object.keys(firstTeam),
              teamId: firstTeam.teamId ?? null,
              won: typeof firstTeam.won === "boolean" ? firstTeam.won : null,
              roundsPlayed: typeof firstTeam.roundsPlayed === "number" ? firstTeam.roundsPlayed : null,
              roundsWon: typeof firstTeam.roundsWon === "number" ? firstTeam.roundsWon : null,
              numPoints: typeof firstTeam.numPoints === "number" ? firstTeam.numPoints : null,
              roundsLost: typeof firstTeam.roundsLost === "number" ? firstTeam.roundsLost : null,
            }
          : null,
      }
    }
  } catch (error) {
    directFetch = {
      ok: false,
      status: 0,
      bodyStatusCode: null,
      bodyMessage: sanitizeMessage(error),
      firstMatchId: null,
    }
  }

  let adapter = {
    ok: false,
    status: 0,
    code: "not-executed",
    message: "not-executed",
  }

  try {
    await riotAdapter.getNormalizedMatches(session.puuid, 1)
    adapter = {
      ok: true,
      status: 200,
      code: "ok",
      message: "adapter request succeeded",
    }
  } catch (error) {
    const normalized = normalizeRiotApiError(error)
    adapter = {
      ok: false,
      status: normalized.status,
      code: normalized.code,
      message: sanitizeMessage(normalized.message),
    }
  }

  const ok = directFetch.ok && adapter.ok
  const stage = !directFetch.ok ? "direct-fetch" : !adapter.ok ? "adapter" : "ok"
  const status = !directFetch.ok ? directFetch.status : !adapter.ok ? adapter.status : 200
  const code = !directFetch.ok ? "direct_fetch_failed" : !adapter.ok ? adapter.code : "ok"
  const message = !directFetch.ok
    ? sanitizeMessage(directFetch.bodyMessage || "Direct Riot fetch failed")
    : !adapter.ok
      ? adapter.message
      : "diagnostic ok"

  return NextResponse.json({
    ok,
    stage,
    status,
    code,
    message,
    riotPlatform: env.riotPlatform,
    requestUrl,
    authMode,
    apiKeyConfigured,
    apiKeyLength,
    apiKeyPrefix,
    directFetch,
    matchDetailShape,
    adapter,
  })
}