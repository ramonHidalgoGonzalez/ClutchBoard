import { NextResponse } from "next/server"

import { getCurrentSession } from "@/server/auth/session"

export async function GET() {
  const session = await getCurrentSession()

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      account: null,
    })
  }

  return NextResponse.json({
    authenticated: true,
    account: {
      puuid: session.puuid,
      gameName: session.gameName,
      tagLine: session.tagLine,
    },
  })
}