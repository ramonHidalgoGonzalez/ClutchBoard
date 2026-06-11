import { getCurrentSession } from "@/server/auth/session"
import { withApiProtection } from "@/server/api/route-helpers"
import { getMatchesData } from "@/server/services/match-service"

export async function GET() {
  const session = await getCurrentSession()
  return withApiProtection(`matches:${session?.userId ?? "anonymous"}`, async () => getMatchesData(session?.puuid))
}
