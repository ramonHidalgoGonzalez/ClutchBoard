import { randomUUID } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { env } from "@/lib/env"
import { createAppSession } from "@/server/auth/session"
import { verifyRiotState } from "@/server/auth/rso"
import { findOrCreateUserFromRiotAccount } from "@/server/repositories/user-repository"

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state")
  const code = request.nextUrl.searchParams.get("code")

  if (!(await verifyRiotState(state))) {
    return NextResponse.redirect(new URL("/login?error=state", env.appUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=code", env.appUrl))
  }

  const tokens = await riotAdapter.exchangeCodeForTokens(code)
  const account = await riotAdapter.getCurrentAccount(tokens.access_token)
  const { user } = await findOrCreateUserFromRiotAccount(account)

  await createAppSession({
    sessionId: randomUUID(),
    userId: user.id,
    puuid: account.puuid,
    gameName: account.gameName,
    tagLine: account.tagLine,
  })

  return NextResponse.redirect(new URL("/dashboard", env.appUrl))
}
