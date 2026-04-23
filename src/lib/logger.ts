import pino from "pino"

import { env } from "@/lib/env"

let logger: pino.Logger | null = null

export function getLogger() {
  if (!logger) {
    logger = pino({
      level: env.logLevel,
        base: {
        service: "clutchboard",
        env: env.nodeEnv,
      },
    })
  }

  return logger
}
