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
    if (parsed && typeof parsed === "object") {
      const statusObj = (parsed as { status?: { status_code?: number; message?: string } }).status
      bodyStatusCode = statusObj?.status_code ?? null
      bodyMessage = sanitizeMessage(statusObj?.message ?? "")
    }

    directFetch = {
      ok: response.ok,
      status: response.status,
      bodyStatusCode,
      bodyMessage,
    }
  } catch (error) {
    directFetch = {
      ok: false,
      status: 0,
      bodyStatusCode: null,
      bodyMessage: sanitizeMessage(error),
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
    adapter,
  })
}