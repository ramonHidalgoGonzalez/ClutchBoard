import { vi } from "vitest"

type EnvModule = typeof import("@/lib/env")

describe("env boolean parsing", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  async function loadEnvModule(overrides: Record<string, string | undefined>): Promise<EnvModule> {
    process.env = {
      ...originalEnv,
      ...overrides,
    }

    vi.resetModules()
    return import("@/lib/env")
  }

  it('parses ENABLE_MOCK_RIOT="false" as false', async () => {
    const { env } = await loadEnvModule({ ENABLE_MOCK_RIOT: "false" })
    expect(env.enableMockRiot).toBe(false)
  })

  it('parses ENABLE_MOCK_RIOT="true" as true', async () => {
    const { env } = await loadEnvModule({ ENABLE_MOCK_RIOT: "true" })
    expect(env.enableMockRiot).toBe(true)
  })

  it('parses DEMO_AUTO_LOGIN="false" as false', async () => {
    const { env } = await loadEnvModule({ DEMO_AUTO_LOGIN: "false" })
    expect(env.demoAutoLogin).toBe(false)
  })

  it('parses DEMO_AUTO_LOGIN="true" as true', async () => {
    const { env } = await loadEnvModule({ DEMO_AUTO_LOGIN: "true" })
    expect(env.demoAutoLogin).toBe(true)
  })
})
