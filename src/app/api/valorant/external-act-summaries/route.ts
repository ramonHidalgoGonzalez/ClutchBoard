import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import {
  createExternalActSummary,
  listExternalActSummaries,
} from "@/server/repositories/external-act-summary-repository"
import { validateExternalActInput } from "@/server/valorant/analytics/external-act-summaries"

export async function GET() {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ summaries: await listExternalActSummaries(session.userId) })
}

export async function POST(request: Request) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validation = validateExternalActInput(body)
  if (!validation.ok) return NextResponse.json({ error: "validation", errors: validation.errors }, { status: 400 })

  // PUUID from the session, never the client.
  const summary = await createExternalActSummary(session.userId, session.puuid, validation.value)
  return NextResponse.json({ summary }, { status: 201 })
}
