"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "clutchboard_last_autosync"
const COOLDOWN_MS = 15 * 60 * 1000

/**
 * Fire-and-forget background sync of recent matches. Renders nothing, never
 * blocks the page, and self-throttles to once per 15 min via localStorage (the
 * server also enforces a cooldown). Refreshes the route when new matches land.
 */
export function AutoSync() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    let last = 0
    try {
      last = Number(window.localStorage.getItem(STORAGE_KEY) || 0)
    } catch {
      // ignore
    }
    if (Date.now() - last < COOLDOWN_MS) return

    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      // ignore
    }

    fetch("/api/valorant/sync-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "recent", auto: true }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result && !result.skipped && result.savedMatches > 0) {
          router.refresh()
        }
      })
      .catch(() => {
        // background sync is best-effort
      })
  }, [router])

  return null
}
