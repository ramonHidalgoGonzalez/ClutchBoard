import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import { getContentCatalog } from "@/server/services/content-service"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const catalog = await getContentCatalog()

  return NextResponse.json({
    version: catalog.version,
    agents: catalog.agents,
    maps: catalog.maps,
  })
}
