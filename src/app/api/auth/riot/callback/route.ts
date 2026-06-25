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

  const log = (stage: string) => logger.info({ flow: "rso-callback", stage }, `rso-callback ${stage}`)
  const warn = (stage: string, error: unknown) =>
    logger.warn(
      { flow: "rso-callback", stage, error: error instanceof Error ? error.message : "unknown" },
      `rso-callback ${stage}`,
    )

  log("start")

  // Token exchange (RSO) — never log the tokens themselves.
  let tokens
  try {
    tokens = await riotAdapter.exchangeCodeForTokens(code)
    log("token_exchange_ok")
  } catch (error) {
    warn("token_exchange", error)
    return NextResponse.redirect(new URL("/login?error=rso_exchange", env.appUrl))
  }

  // Resolve the Riot account.
  let account
  try {
    account = await riotAdapter.getCurrentAccount(tokens.access_token)
    log("account_fetch_ok")
  } catch (error) {
    warn("account_fetch", error)
    return NextResponse.redirect(new URL("/login?error=rso_account", env.appUrl))
  }

  // Persist the user — non-fatal: if the DB is unavailable / not migrated, fall
  // back to a deterministic session user so RSO login still works (degraded).
  log("db_start")
  let userId: string
  try {
    const { user } = await findOrCreateUserFromRiotAccount(account)
    userId = user.id
    log("db_user_saved")
  } catch (error) {
    warn("db_user_failed", error)
    userId = `user-${account.puuid}`
  }

  // Create the session. The signed cookie is always set; the DB record is
  // best-effort inside createAppSession, so this only fails on a cookie error.
  try {
    await createAppSession({
      sessionId: randomUUID(),
      userId,
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
    })
    log("session_created")
  } catch (error) {
    logger.error(
      { flow: "rso-callback", stage: "session_failed", error: error instanceof Error ? error.message : "unknown" },
      "rso-callback session_failed",
    )
    return NextResponse.redirect(new URL("/login?error=session", env.appUrl))
  }

  log("redirect")
  return NextResponse.redirect(new URL("/dashboard", env.appUrl))
}
