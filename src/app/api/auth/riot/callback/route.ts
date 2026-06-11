import { randomUUID } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { env, hasRsoClientCredentials } from "@/lib/env"
import { getLogger } from "@/lib/logger"
import { createAppSession } from "@/server/auth/session"
import { verifyRiotState } from "@/server/auth/rso"
import { findOrCreateUserFromRiotAccount } from "@/server/repositories/user-repository"

export async function GET(request: NextRequest) {
  const logger = getLogger()

  if (env.enableMockRiot) {
    return NextResponse.redirect(new URL("/dashboard", env.appUrl))
  }

  if (!hasRsoClientCredentials()) {
    return NextResponse.redirect(new URL("/login?error=rso_not_configured", env.appUrl))
  }

  const state = request.nextUrl.searchParams.get("state")
  const code = request.nextUrl.searchParams.get("code")

  if (!(await verifyRiotState(state))) {
    return NextResponse.redirect(new URL("/login?error=state", env.appUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=code", env.appUrl))
  }

  try {
    const tokens = await riotAdapter.exchangeCodeForTokens(code)

    let account
    try {
      account = await riotAdapter.getCurrentAccount(tokens.access_token)
    } catch (error) {
      logger.warn(
        {
          flow: "rso-callback",
          stage: "accounts-me",
          error: error instanceof Error ? error.message : "unknown",
        },
        "Riot accounts/me request failed",
      )
      return NextResponse.redirect(new URL("/login?error=rso_account", env.appUrl))
    }

    const { user } = await findOrCreateUserFromRiotAccount(account)

    await createAppSession({
      sessionId: randomUUID(),
      userId: user.id,
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
    })
  } catch (error) {
    logger.warn(
      {
        flow: "rso-callback",
        stage: "token-exchange",
        error: error instanceof Error ? error.message : "unknown",
      },
      "Riot token exchange failed",
    )
    return NextResponse.redirect(new URL("/login?error=rso_exchange", env.appUrl))
  }

  return NextResponse.redirect(new URL("/dashboard", env.appUrl))
}
