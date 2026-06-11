import { getCurrentSession } from "@/server/auth/session"
import { withApiProtection } from "@/server/api/route-helpers"
import { getDashboardPayload } from "@/server/services/dashboard-service"

export async function GET() {
  const session = await getCurrentSession()
  return withApiProtection(`dashboard:${session?.userId ?? "anonymous"}`, async () =>
    getDashboardPayload(
      session
        ? {
            puuid: session.puuid,
            gameName: session.gameName,
            tagLine: session.tagLine,
          }
        : undefined,
    ),
  )
}
