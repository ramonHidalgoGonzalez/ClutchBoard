import { appendFileSync } from "node:fs"
import { join } from "node:path"

import { app } from "electron"

export type LogEvent =
  | "app_started"
  | "valorant_detected"
  | "valorant_closed"
  | "sync_started"
  | "sync_success"
  | "sync_failed"
  | "sync_skipped_cooldown"
  | "open_dashboard"
  | "login_opened"

// Only whitelisted, non-sensitive fields are ever written. Never tokens,
// cookies, DATABASE_URL, Riot API key or any secret.
type SafeFields = {
  savedMatches?: number
  matchlistReturned?: number
  error?: string
  reason?: string
}

let logPath: string | null = null

function path(): string {
  if (!logPath) logPath = join(app.getPath("userData"), "companion.log")
  return logPath
}

export function log(event: LogEvent, fields: SafeFields = {}): void {
  const line = `${new Date().toISOString()} ${event} ${JSON.stringify(fields)}\n`
  // eslint-disable-next-line no-console
  console.log(`[companion] ${event}`, fields)
  try {
    appendFileSync(path(), line, "utf8")
  } catch {
    // logging must never crash the app
  }
}

export function logFilePath(): string {
  return path()
}
