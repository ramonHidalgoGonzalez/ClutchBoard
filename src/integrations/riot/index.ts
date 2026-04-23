import { env, hasRealRiotCredentials } from "@/lib/env"

import * as mock from "@/integrations/riot/mock-adapter"
import * as real from "@/integrations/riot/real-adapter"

export const riotAdapter = env.enableMockRiot || !hasRealRiotCredentials() ? mock : real
