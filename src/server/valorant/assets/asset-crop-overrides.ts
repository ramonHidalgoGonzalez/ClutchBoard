import { normalizeAgentSlug, normalizeMapSlug } from "./slugs"

type CropContext = { objectPosition?: string }

/**
 * Optional per-asset object-position overrides. The generated WebP crops are
 * already centered for most agents/maps; add an entry only when a specific
 * asset reads better with a different anchor. Empty by default — fill as needed
 * by inspecting the rendered result, no logic changes required.
 */
export const agentCropOverrides: Record<string, Partial<Record<"table" | "card" | "hero", CropContext>>> = {
  // breach: { table: { objectPosition: "center top" }, hero: { objectPosition: "right bottom" } },
}

export const mapCropOverrides: Record<string, Partial<Record<"thumb" | "banner" | "card", CropContext>>> = {
  // haven: { thumb: { objectPosition: "center" } },
}

export function getAgentCropPosition(
  agentName: string | null | undefined,
  context: "table" | "card" | "hero",
): string | undefined {
  if (!agentName) return undefined
  return agentCropOverrides[normalizeAgentSlug(agentName)]?.[context]?.objectPosition
}

export function getMapCropPosition(
  mapName: string | null | undefined,
  context: "thumb" | "banner" | "card",
): string | undefined {
  if (!mapName) return undefined
  return mapCropOverrides[normalizeMapSlug(mapName)]?.[context]?.objectPosition
}
