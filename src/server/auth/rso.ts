import { randomBytes } from "node:crypto"

import { cookies } from "next/headers"

import { env } from "@/lib/env"

const STATE_COOKIE = "riot_rso_state"

export async function createRiotAuthorizationUrl() {
  const state = randomBytes(16).toString("hex")
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  const search = new URLSearchParams({
    client_id: env.riotRsoClientId ?? "",
    redirect_uri: env.riotRsoRedirectUri,
    response_type: "code",
    scope: env.riotRsoScopes,
    state,
  })

  return `https://auth.riotgames.com/authorize?${search.toString()}`
}

export async function verifyRiotState(state: string | null) {
  const cookieStore = await cookies()
  const expected = cookieStore.get(STATE_COOKIE)?.value
  cookieStore.delete(STATE_COOKIE)
  return Boolean(state && expected && state === expected)
}
