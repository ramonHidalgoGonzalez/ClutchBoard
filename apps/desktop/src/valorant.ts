import { execFile } from "node:child_process"

import { RIOT_CLIENT_PROCESS, VALORANT_GAME_PROCESSES } from "./config"

export type ValorantState = {
  /** A VALORANT game process is running (the signal we auto-sync on). */
  gameRunning: boolean
  /** Riot client/launcher running — secondary hint only, not a match signal. */
  clientRunning: boolean
}

/**
 * Detect VALORANT purely by process name via Windows `tasklist`. No memory
 * reading, no DLL injection, no overlay, never touches Vanguard.
 */
export function detectValorant(): Promise<ValorantState> {
  if (process.platform !== "win32") return Promise.resolve({ gameRunning: false, clientRunning: false })
  return new Promise((resolve) => {
    execFile("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true }, (error, stdout) => {
      if (error || !stdout) {
        resolve({ gameRunning: false, clientRunning: false })
        return
      }
      const lower = stdout.toLowerCase()
      resolve({
        gameRunning: VALORANT_GAME_PROCESSES.some((name) => lower.includes(name.toLowerCase())),
        clientRunning: lower.includes(RIOT_CLIENT_PROCESS.toLowerCase()),
      })
    })
  })
}
