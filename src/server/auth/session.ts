import { createHash, randomBytes } from "node:crypto"

import { SignJWT, jwtVerify } from "jose"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { getSessionSecret } from "@/lib/env"
import { createSessionRecord, findSessionRecord, revokeSessionRecord } from "@/server/repositories/session-repository"

const COOKIE_NAME = "valorant_tracker_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

type SessionPayload = {
  sessionId: string
  userId: string
  puuid: string
  gameName: string
  tagLine: string
}

function getSecretKey() {
  return new TextEncoder().encode(getSessionSecret())
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createAppSession(payload: SessionPayload) {
  const rawToken = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
  const signedToken = await new SignJWT({
    ...payload,
    rawToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey())

  await createSessionRecord({
    id: payload.sessionId,
    userId: payload.userId,
    sessionTokenHash: hashToken(rawToken),
    expiresAt,
    userAgent: (await headers()).get("user-agent") ?? undefined,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })

  return signedToken
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token, getSecretKey())
    const payload = verified.payload as unknown as SessionPayload & { rawToken: string }
    const session = await findSessionRecord(hashToken(payload.rawToken))

    if (session && new Date(session.expiresAt).getTime() < Date.now()) {
      cookieStore.delete(COOKIE_NAME)
      return null
    }

    return payload
  } catch {
    cookieStore.delete(COOKIE_NAME)
    return null
  }
}

export async function requireSession() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function destroySession() {
  const session = await getCurrentSession()

  if (session?.rawToken) {
    await revokeSessionRecord(hashToken(session.rawToken))
  }

  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
