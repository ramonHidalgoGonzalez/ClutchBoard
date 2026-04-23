import { env } from "@/lib/env"
import { getLogger } from "@/lib/logger"

type FetchOptions = {
  method?: "GET" | "POST"
  accessToken?: string
  body?: URLSearchParams | string
  headers?: HeadersInit
  retries?: number
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
  ) {
    super(message)
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

    if (options.accessToken) {
      headers.set("Authorization", `Bearer ${options.accessToken}`)
    } else if (env.riotApiKey) {
      headers.set("X-Riot-Token", env.riotApiKey)
    }

    if (options.body && !headers.has("Content-Type") && !(options.body instanceof URLSearchParams)) {
      headers.set("Content-Type", "application/json")
    }

    const retries = options.retries ?? 2

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body,
        cache: "no-store",
      })

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
      throw new RiotApiError(
        `Riot request failed (${response.status}) for ${url}: ${errorBody}`,
        response.status,
      )
    }

    throw new RiotApiError(`Unexpected Riot request failure for ${url}`, 500)
  }
}
