import { AGENT_ASSET_MAP } from "./agent-asset-map.generated"
import { normalizeAgentSlug } from "./slugs"

export type AgentAssetEntry = {
  name: string
  table: string
  card: string
  hero: string
}

export type AgentAssetSet = {
  table: string | null
  card: string | null
  hero: string | null
}

export { normalizeAgentSlug }

export const agentAssets = AGENT_ASSET_MAP

/**
 * Curated local agent assets by visual context. Returns null per slot when no
 * local asset exists so callers can fall back to remote/visual placeholders.
 */
export function getAgentAssets(agentName?: string | null): AgentAssetSet {
  const entry = agentName ? AGENT_ASSET_MAP[normalizeAgentSlug(agentName)] : undefined
  return {
    table: entry?.table ?? null,
    card: entry?.card ?? null,
    hero: entry?.hero ?? null,
  }
}
