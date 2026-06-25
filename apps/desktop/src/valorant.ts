import { execFile } from "node:child_process"

import { VALORANT_PROCESSES } from "./config"

/**
 * Detect VALORANT purely by process name via Windows `tasklist`. No memory
 * reading, no DLL injection, no overlay — just "is the process running".
 */
export function isValorantRunning(): Promise<boolean> {
  if (process.platform !== "win32") return Promise.resolve(false)
  return new Promise((resolve) => {
    execFile("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true }, (error, stdout) => {
      if (error || !stdout) {
        resolve(false)
        return
      }
      const lower = stdout.toLowerCase()
      resolve(VALORANT_PROCESSES.some((name) => lower.includes(name.toLowerCase())))
    })
  })
}
