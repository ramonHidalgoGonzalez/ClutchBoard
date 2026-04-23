import { getCurrentSession } from "@/server/auth/session"
import { withApiProtection } from "@/server/api/route-helpers"
import { getImprovementData } from "@/server/services/improvement-service"

export async function GET() {
  const session = await getCurrentSession()
  return withApiProtection(`improvement:${session?.userId ?? "anonymous"}`, async () => getImprovementData())
}
