import { NextResponse } from "next/server"

import { env, hasRealRiotCredentials } from "@/lib/env"

export async function GET() {
  return NextResponse.json({
    ok: true,
    mode: env.enableMockRiot ? "mock" : "riot",
    riotConfigured: hasRealRiotCredentials(),
    timestamp: new Date().toISOString(),
  })
}
