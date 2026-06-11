import { env } from "@/lib/env"
import { getLogger } from "@/lib/logger"

type FetchOptions = {
  method?: "GET" | "POST"
  accessToken?: string
  body?: URLSearchParams | string
  headers?: HeadersInit
  retries?: number
  timeoutMs?: number
}

const REGION_HOSTS = {
  americas: "https://americas.api.riotgames.com",
  asia: "https://asia.api.riotgames.com",
  europe: "https://europe.api.riotgames.com",
} as const

const PLATFORM_HOSTS = {
  ap: "https://ap.api.riotgames.com",
  br: "https://br.api.riotgames.com",
  esports: "https://esports.api.riotgames.com",
  eu: "https://eu.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  latam: "https://latam.api.riotgames.com",
  na: "https://na.api.riotgames.com",
} as const

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RiotApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code = "riot_request_failed",
  ) {
    super(message)
  }
}

export function normalizeRiotApiError(error: unknown) {
  if (error instanceof RiotApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
    }
  }

  return {
    status: 500,
    code: "riot_unknown_error",
    message: error instanceof Error ? error.message : "Unknown Riot API error",
  }
}

export class RiotHttpClient {
  private logger = getLogger()

  async regionRequest<T>(region: keyof typeof REGION_HOSTS, path: string, options?: FetchOptions) {
    return this.request<T>(`${REGION_HOSTS[region]}${path}`, options)
  }

  async platformRequest<T>(platform: keyof typeof PLATFORM_HOSTS, path: string, options?: FetchOptions) {
    return this.request<T>(`${PLATFORM_HOSTS[platform]}${path}`, options)
  }

  async authRequest<T>(path: string, options?: FetchOptions) {
    return this.request<T>(`https://auth.riotgames.com${path}`, options)
  }

  private async request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const headers = new Headers(options.headers)
    const usesBearerAuth = Boolean(options.accessToken)
    const apiKeyConfigured = Boolean(env.riotApiKey)
    const apiKeyLength = env.riotApiKey?.length ?? 0
    const apiKeyPrefix = env.riotApiKey ? env.riotApiKey.slice(0, 6) : ""

    if (options.accessToken) {
      headers.set("Authorization", `Bearer ${options.accessToken}`)
    } else if (env.riotApiKey) {
      headers.set("X-Riot-Token", env.riotApiKey)
    }

    if (options.body && !headers.has("Content-Type") && !(options.body instanceof URLSearchParams)) {
      headers.set("Content-Type", "application/json")
    }

    const retries = options.retries ?? 2
    const timeoutMs = options.timeoutMs ?? 10_000

    if (env.riotDebugMatchCheck && url.includes("/val/match/v1/")) {
      this.logger.info(
        {
          apiKeyConfigured,
          apiKeyLength,
          apiKeyPrefix,
          riotPlatform: env.riotPlatform,
          requestUrl: url,
          authMode: usesBearerAuth ? "bearer" : "x-riot-token",
        },
        "Riot match request diagnostics",
      )
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      let response: Response

      try {
        response = await fetch(url, {
          method: options.method ?? "GET",
          headers,
          body: options.body,
          cache: "no-store",
          signal: controller.signal,
        })
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new RiotApiError(`Riot request timeout for ${url}`, 504, "riot_timeout")
        }

        throw new RiotApiError(
          `Riot request transport failure for ${url}: ${error instanceof Error ? error.message : "unknown"}`,
          502,
          "riot_transport_error",
        )
      } finally {
        clearTimeout(timeout)
      }

      if (response.ok) {
        return response.json() as Promise<T>
      }

      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? "1")
        this.logger.warn({ url, status: response.status, attempt }, "Riot request retrying")

        if (attempt < retries) {
          await sleep(retryAfter * 1000 + attempt * 300)
          continue
        }
      }

      const errorBody = await response.text()
      const code = response.status === 429 ? "riot_rate_limited" : "riot_request_failed"
      throw new RiotApiError(
        `Riot request failed (${response.status}) for ${url}: ${errorBody}`,
        response.status,
        code,
      )
    }

    throw new RiotApiError(`Unexpected Riot request failure for ${url}`, 500, "riot_unexpected")
  }
}
