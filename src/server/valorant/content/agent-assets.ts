import { toSlug } from "@/lib/slug"

import { AGENT_ASSET_MAP } from "./agent-asset-map.generated"

export type AgentAssetEntry = {
  name: string
  avatar: string
  portrait: string
  banner: string | null
}

export type AgentVisual = {
  slug: string
  avatar: string
  portrait: string
  banner: string | null
}

/**
 * Filesystem-safe slug for agent asset filenames.
 *   "KAY/O" -> "kayo", "Jett" -> "jett", "Deadlock" -> "deadlock"
 * Non-alphanumerics are removed (no dashes), unlike the routing slug.
 */
export function normalizeAgentSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

export const agentAssetMap = AGENT_ASSET_MAP

/** Local optimized asset entry for an agent name/slug, or null if unmapped. */
export function getAgentAssets(nameOrSlug: string): AgentAssetEntry | null {
  const slug = normalizeAgentSlug(nameOrSlug)
  return agentAssetMap[slug] ?? null
}

/**
 * Resolve agent imagery with graceful fallback to the legacy bundled portrait
 * so unmapped/new agents still render an image (never a broken asset).
 */
export function resolveAgentVisual(name?: string | null): AgentVisual {
  const safeName = name ?? ""
  const slug = normalizeAgentSlug(safeName)
  const entry = agentAssetMap[slug]
  const legacy = `/game-assets/agents/${toSlug(safeName)}.png`

  return {
    slug,
    avatar: entry?.avatar ?? legacy,
    portrait: entry?.portrait ?? legacy,
    banner: entry?.banner ?? null,
  }
}
