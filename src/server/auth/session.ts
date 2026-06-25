import { createHash, randomBytes } from "node:crypto"

import { SignJWT, jwtVerify } from "jose"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { env, getSessionSecret } from "@/lib/env"
import { getLogger } from "@/lib/logger"
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

  // Best-effort server-side record. The signed cookie is self-contained, so a
  // DB hiccup (tables missing, connection error) must not break login.
  try {
    await createSessionRecord({
      id: payload.sessionId,
      userId: payload.userId,
      sessionTokenHash: hashToken(rawToken),
      expiresAt,
      userAgent: (await headers()).get("user-agent") ?? undefined,
    })
  } catch (error) {
    getLogger().warn(
      { flow: "session", stage: "session_record_failed", error: error instanceof Error ? error.message : "unknown" },
      "Session record persistence failed; continuing with the signed cookie",
    )
  }

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

    // The signed JWT (with its own expiry, enforced by jwtVerify above) is the
    // source of truth. The DB record is a best-effort enhancement for
    // revocation: only reject when we positively find an expired record. A
    // missing record or a DB error must not lock the user out.
    if (!env.databaseUrl) {
      return payload
    }

    try {
      const session = await findSessionRecord(hashToken(payload.rawToken))
      if (session && new Date(session.expiresAt).getTime() < Date.now()) {
        return null
      }
      return payload
    } catch (error) {
      getLogger().warn(
        { flow: "session", stage: "session_lookup_failed", error: error instanceof Error ? error.message : "unknown" },
        "Session lookup failed; trusting the signed cookie",
      )
      return payload
    }
  } catch {
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
