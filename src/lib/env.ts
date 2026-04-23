const isProduction = process.env.NODE_ENV === "production"

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  logLevel: process.env.LOG_LEVEL ?? "info",
  enableMockRiot: process.env.ENABLE_MOCK_RIOT !== "false",
  demoAutoLogin: process.env.DEMO_AUTO_LOGIN === "true",
  databaseUrl: process.env.DATABASE_URL,
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  riotApiKey: process.env.RIOT_API_KEY,
  riotRsoClientId: process.env.RIOT_RSO_CLIENT_ID,
  riotRsoClientSecret: process.env.RIOT_RSO_CLIENT_SECRET,
  riotRsoRedirectUri:
    process.env.RIOT_RSO_REDIRECT_URI ?? "http://localhost:3000/api/auth/riot/callback",
  riotRsoScopes: process.env.RIOT_RSO_SCOPES ?? "openid offline_access",
  riotRegion: process.env.RIOT_REGION ?? "eu",
  riotPlatform: process.env.RIOT_PLATFORM ?? "eu",
}

export function getSessionSecret() {
  if (process.env.APP_SESSION_SECRET) {
    return process.env.APP_SESSION_SECRET
  }

  if (!isProduction && env.enableMockRiot) {
    // Dev-only fallback so the demo app can boot without production credentials.
    return "local-demo-session-secret-change-me"
  }

  throw new Error("APP_SESSION_SECRET is required outside local mock development.")
}

export function hasRealRiotCredentials() {
  return Boolean(
    env.riotApiKey &&
      env.riotRsoClientId &&
      env.riotRsoClientSecret &&
      env.riotRsoRedirectUri,
  )
}
