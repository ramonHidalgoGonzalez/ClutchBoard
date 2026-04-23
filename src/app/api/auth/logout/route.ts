import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { destroySession } from "@/server/auth/session"

export async function GET() {
  await destroySession()
  return NextResponse.redirect(new URL("/login", env.appUrl))
}
