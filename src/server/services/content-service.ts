import { riotAdapter } from "@/integrations/riot"
import { getArtworkUrl } from "@/lib/game-visuals"
import { getLogger } from "@/lib/logger"
import {
  buildMapLookupKeys,
  normalizeContentKey,
  resolveCanonicalMapName,
} from "@/lib/valorant-content"
import type { AgentContent, ContentCatalog, MapContent } from "@/types/domain"

const logger = getLogger()
const CONTENT_TTL_MS = 12 * 60 * 60 * 1000

const AGENT_FALLBACKS = ["#ff6b6b", "#4ecdc4", "#f7b267", "#5f27cd", "#54a0ff", "#10ac84"]
const MAP_FALLBACKS = ["#ff9f43", "#48dbfb", "#1dd1a1", "#f368e0", "#576574", "#c8d6e5"]

let cache: { expiresAt: number; value: ContentCatalog } | null = null

function fallbackImage(kind: "agent" | "map", name: string) {
  return `/api/media/${kind}/${encodeURIComponent(name)}`
}

// Only accept absolute http(s) URLs as "real" Riot imagery. The official
// content endpoint omits these fields and sometimes exposes internal engine
// paths (e.g. "/Game/Maps/Triad/Triad") that are not usable as <img> sources.
function usableRemoteImage(value?: string | null) {
  return typeof value === "string" && /^https?:\/\//.test(value) ? value : null
}

// Prefer a real Riot URL, then the bundled local artwork
// (/public/game-assets/<kind>/<slug>.png), then the generated SVG placeholder.
function resolveImageUrl(kind: "agent" | "map", name: string, ...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const remote = usableRemoteImage(candidate)
    if (remote) {
      return remote
    }
  }

  return getArtworkUrl(kind, name) || fallbackImage(kind, name)
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

  return {
    id: entry.id,
    displayName,
    displayIconUrl: resolveImageUrl("agent", displayName, entry.displayIcon),
    fullPortraitUrl: resolveImageUrl("agent", displayName, entry.fullPortraitV2, entry.fullPortrait),
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
  const displayName =
    entry.displayName || resolveCanonicalMapName(entry.mapUrl || entry.assetPath || entry.name)

  return {
    id: entry.id,
    displayName,
    splashUrl: resolveImageUrl("map", displayName, entry.splash),
    listViewIconUrl: resolveImageUrl("map", displayName, entry.listViewIcon),
    coordinates: entry.coordinates || null,
    fallbackColor: MAP_FALLBACKS[index % MAP_FALLBACKS.length] || "#0ea5e9",
  }
}

function buildLookups(
  agents: AgentContent[],
  maps: MapContent[],
  rawMaps?: Array<{
    id: string
    name: string
    displayName?: string | null
    mapUrl?: string | null
    assetPath?: string | null
  }>,
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

    for (const key of buildMapLookupKeys(
      map.id,
      map.displayName,
      rawMap?.name,
      rawMap?.mapUrl,
      rawMap?.displayName,
      // The match payload identifies maps by their internal asset path/codename.
      rawMap?.assetPath,
    )) {
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
    const direct =
      catalog.lookups.mapById.get(normalizedId) ||
      catalog.lookups.mapByName.get(normalizedId) ||
      catalog.lookups.mapByPath.get(normalizedId)
    if (direct) {
      return direct
    }

    // Translate "/Game/Maps/Triad/Triad" (or a bare codename) to "Haven".
    const canonical = catalog.lookups.mapByName.get(normalizeContentKey(resolveCanonicalMapName(candidateId!)))
    if (canonical) {
      return canonical
    }
  }

  if (normalizedName) {
    return (
      catalog.lookups.mapByName.get(normalizedName) ||
      catalog.lookups.mapByPath.get(normalizedName) ||
      catalog.lookups.mapByName.get(normalizeContentKey(resolveCanonicalMapName(candidateName!))) ||
      null
    )
  }

  return null
}
