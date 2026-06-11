import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { riotAdapter } from "@/integrations/riot"
import { env, hasRsoClientCredentials } from "@/lib/env"
import { createAppSession } from "@/server/auth/session"
import { createRiotAuthorizationUrl } from "@/server/auth/rso"
import { findOrCreateUserFromRiotAccount } from "@/server/repositories/user-repository"

export async function GET() {
  if (env.enableMockRiot) {
    const account = await riotAdapter.getCurrentAccount()
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

  if (!hasRsoClientCredentials()) {
    return NextResponse.redirect(new URL("/login?error=rso_not_configured", env.appUrl))
  }

  try {
    const authorizationUrl = await createRiotAuthorizationUrl()
    return NextResponse.redirect(authorizationUrl)
  } catch {
    return NextResponse.redirect(new URL("/login?error=rso_unavailable", env.appUrl))
  }
}
