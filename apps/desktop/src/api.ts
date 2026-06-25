import { net } from "electron"

import { CLUTCHBOARD_URL } from "./config"

// Uses Electron's net + defaultSession, so the cookie set by the in-app login
// window is sent automatically. We never read or store Riot tokens ourselves.
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return net.fetch(`${CLUTCHBOARD_URL}${path}`, { ...init, credentials: "include" })
}

export type SessionState = { connected: boolean; name?: string }

export async function checkSession(): Promise<SessionState> {
  try {
    const res = await apiFetch("/api/me")
    if (!res.ok) return { connected: false }
    // /api/me returns 200 with { authenticated, account } in both states.
    const data = (await res.json().catch(() => ({}))) as {
      authenticated?: boolean
      account?: { gameName?: string; tagLine?: string }
    }
    if (!data.authenticated || !data.account) return { connected: false }
    const name = data.account.gameName ? `${data.account.gameName}#${data.account.tagLine ?? ""}` : undefined
    return { connected: true, name }
  } catch {
    return { connected: false }
  }
}

export type SyncOutcome = {
  ok: boolean
  savedMatches: number
  matchlistReturned: number
  rateLimited: boolean
  error?: "unauthenticated" | "rate_limited" | "network" | string
}

export async function syncRecent(): Promise<SyncOutcome> {
  const base = { ok: false, savedMatches: 0, matchlistReturned: 0, rateLimited: false }
  try {
    const res = await apiFetch("/api/valorant/sync-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "recent" }),
    })
    if (res.status === 401) return { ...base, error: "unauthenticated" }
    if (res.status === 429) return { ...base, rateLimited: true, error: "rate_limited" }
    if (!res.ok) return { ...base, error: `http_${res.status}` }
    const data = (await res.json().catch(() => ({}))) as {
      savedMatches?: number
      matchlistReturned?: number
      warnings?: string[]
    }
    const rateLimited = (data.warnings ?? []).some((w) => /429|rate.?limit/i.test(w))
    return {
      ok: true,
      savedMatches: data.savedMatches ?? 0,
      matchlistReturned: data.matchlistReturned ?? 0,
      rateLimited,
    }
  } catch {
    return { ...base, error: "network" }
  }
}
