import { riotAdapter } from "@/integrations/riot"
import { getLogger } from "@/lib/logger"
import { buildMapLookupKeys, cleanMapName, normalizeContentKey } from "@/lib/valorant-content"
import type { AgentContent, ContentCatalog, MapContent } from "@/types/domain"

const logger = getLogger()
const CONTENT_TTL_MS = 12 * 60 * 60 * 1000

const AGENT_FALLBACKS = ["#ff6b6b", "#4ecdc4", "#f7b267", "#5f27cd", "#54a0ff", "#10ac84"]
const MAP_FALLBACKS = ["#ff9f43", "#48dbfb", "#1dd1a1", "#f368e0", "#576574", "#c8d6e5"]

let cache: { expiresAt: number; value: ContentCatalog } | null = null

function fallbackImage(kind: "agent" | "map", name: string) {
  return `/api/media/${kind}/${encodeURIComponent(name)}`
}

function toAgentContent(index: number, entry: {
  id: string
  name: string
  assetPath?: string | null
  displayName?: string | null
  displayIcon?: string | null
  fullPortrait?: string | null
  fullPortraitV2?: string | null
  role?: { displayName?: string | null } | null
}): AgentContent {
  const displayName = entry.displayName || entry.name || "Unknown Agent"
  const icon = entry.displayIcon || null
  const portrait = entry.fullPortraitV2 || entry.fullPortrait || entry.assetPath || null

  return {
    id: entry.id,
    displayName,
    displayIconUrl: icon || fallbackImage("agent", displayName),
    fullPortraitUrl: portrait || fallbackImage("agent", displayName),
    role: entry.role?.displayName || null,
    fallbackColor: AGENT_FALLBACKS[index % AGENT_FALLBACKS.length] || "#ff4655",
  }
}

function toMapContent(index: number, entry: {
  id: string
  name: string
  assetPath?: string | null
  displayName?: string | null
  splash?: string | null
  listViewIcon?: string | null
  mapUrl?: string | null
  coordinates?: string | null
}): MapContent {
  const displayName = entry.displayName || cleanMapName(entry.mapUrl || entry.name) || "Unknown Map"

  return {
    id: entry.id,
    displayName,
    splashUrl: entry.splash || entry.assetPath || fallbackImage("map", displayName),
    listViewIconUrl: entry.listViewIcon || entry.assetPath || fallbackImage("map", displayName),
    coordinates: entry.coordinates || null,
    fallbackColor: MAP_FALLBACKS[index % MAP_FALLBACKS.length] || "#0ea5e9",
  }
}

function buildLookups(
  agents: AgentContent[],
  maps: MapContent[],
  rawMaps?: Array<{ id: string; name: string; displayName?: string | null; mapUrl?: string | null }>,
) {
  const agentById = new Map<string, AgentContent>()
  const agentByName = new Map<string, AgentContent>()
  const mapById = new Map<string, MapContent>()
  const mapByName = new Map<string, MapContent>()
  const mapByPath = new Map<string, MapContent>()

  for (const agent of agents) {
    agentById.set(normalizeContentKey(agent.id), agent)
    agentByName.set(normalizeContentKey(agent.displayName), agent)
  }

  for (const [index, map] of maps.entries()) {
    const rawMap = rawMaps?.[index]
    mapById.set(normalizeContentKey(map.id), map)

    for (const key of buildMapLookupKeys(map.id, map.displayName, rawMap?.name, rawMap?.mapUrl, rawMap?.displayName)) {
      mapByPath.set(key, map)
    }

    mapByName.set(normalizeContentKey(map.displayName), map)
  }

  return {
    agentById,
    agentByName,
    mapById,
    mapByName,
    mapByPath,
  }
}

function createFallbackCatalog(): ContentCatalog {
  const agents: AgentContent[] = []
  const maps: MapContent[] = []

  return {
    version: "fallback",
    agents,
    maps,
    lookups: buildLookups(agents, maps),
  }
}

export async function getContentCatalog(forceRefresh = false): Promise<ContentCatalog> {
  const now = Date.now()
  if (!forceRefresh && cache && cache.expiresAt > now) {
    return cache.value
  }

  try {
    const content = await riotAdapter.getContent("en-US")
    const agents = content.characters.map((entry, index) => toAgentContent(index, entry))
    const maps = content.maps.map((entry, index) => toMapContent(index, entry))

    const catalog: ContentCatalog = {
      version: content.version,
      agents,
      maps,
      lookups: buildLookups(agents, maps, content.maps),
    }

    cache = {
      expiresAt: now + CONTENT_TTL_MS,
      value: catalog,
    }

    return catalog
  } catch (error) {
    logger.warn(
      {
        scope: "content-service",
        stage: "catalog",
        message: error instanceof Error ? error.message : "unknown",
      },
      "Unable to load Riot content catalog; using fallback",
    )

    const fallback = cache?.value ?? createFallbackCatalog()
    cache = {
      expiresAt: now + 60_000,
      value: fallback,
    }
    return fallback
  }
}

export function resolveAgentContent(catalog: ContentCatalog, candidateId?: string, candidateName?: string) {
  if (candidateId) {
    const byId = catalog.lookups.agentById.get(normalizeContentKey(candidateId))
    if (byId) {
      return byId
    }
  }

  if (candidateName) {
    const byName = catalog.lookups.agentByName.get(normalizeContentKey(candidateName))
    if (byName) {
      return byName
    }
  }

  return null
}

export function resolveMapContent(catalog: ContentCatalog, candidateId?: string, candidateName?: string) {
  const normalizedId = candidateId ? normalizeContentKey(candidateId) : null
  const normalizedName = candidateName ? normalizeContentKey(candidateName) : null

  if (normalizedId) {
    return (
      catalog.lookups.mapById.get(normalizedId) ||
      catalog.lookups.mapByName.get(normalizedId) ||
      catalog.lookups.mapByPath.get(normalizedId) ||
      null
    )
  }

  if (normalizedName) {
    return (
      catalog.lookups.mapByName.get(normalizedName) ||
      catalog.lookups.mapByPath.get(normalizedName) ||
      null
    )
  }

  return null
}
