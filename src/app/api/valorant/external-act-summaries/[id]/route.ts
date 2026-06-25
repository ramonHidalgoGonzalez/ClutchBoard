import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"
import {
  deleteExternalActSummary,
  updateExternalActSummary,
} from "@/server/repositories/external-act-summary-repository"
import { validateExternalActInput } from "@/server/valorant/analytics/external-act-summaries"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const validation = validateExternalActInput(body)
  if (!validation.ok) return NextResponse.json({ error: "validation", errors: validation.errors }, { status: 400 })

  const summary = await updateExternalActSummary(id, session.userId, validation.value)
  if (!summary) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ summary })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ok = await deleteExternalActSummary(id, session.userId)
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
