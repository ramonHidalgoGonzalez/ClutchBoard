import pino from "pino"

import { env } from "@/lib/env"

let logger: pino.Logger | null = null

const VALID_LEVELS = new Set(["trace", "debug", "info", "warn", "error", "fatal", "silent"])

export function getLogger() {
  if (!logger) {
    // Guard against an invalid LOG_LEVEL so logging can never crash a request.
    const level = VALID_LEVELS.has(env.logLevel) ? env.logLevel : "info"
    logger = pino({
      level,
      base: {
        service: "clutchboard",
        env: env.nodeEnv,
      },
    })
  }

  return logger
}
