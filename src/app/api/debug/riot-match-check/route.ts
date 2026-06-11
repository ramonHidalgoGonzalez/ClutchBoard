import { NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { normalizeRiotApiError } from "@/integrations/riot/client"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

export async function GET() {
  if (!env.isProduction || !env.riotDebugMatchCheck) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKeyConfigured = Boolean(env.riotApiKey)
  const apiKeyLength = env.riotApiKey?.length ?? 0

  try {
    await riotAdapter.getMatchListByPuuid(session.puuid)

    return NextResponse.json({
      ok: true,
      status: 200,
      error: null,
      riotPlatform: env.riotPlatform,
      apiKeyConfigured,
      apiKeyLength,
    })
  } catch (error) {
    const normalized = normalizeRiotApiError(error)

    return NextResponse.json({
      ok: false,
      status: normalized.status,
      error: normalized.code,
      riotPlatform: env.riotPlatform,
      apiKeyConfigured,
      apiKeyLength,
    })
  }
}