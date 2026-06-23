import { MAP_ASSET_MAP } from "./map-asset-map.generated"
import { normalizeMapSlug } from "./slugs"

export type MapAssetEntry = {
  name: string
  thumb: string
  banner: string
  card: string
}

export type MapAssetSet = {
  thumb: string | null
  banner: string | null
  card: string | null
}

export { normalizeMapSlug }

export const mapAssets = MAP_ASSET_MAP

/**
 * Curated local map assets by visual context. Returns null per slot when no
 * local asset exists so callers can fall back to remote/visual placeholders.
 */
export function getMapAssets(mapName?: string | null): MapAssetSet {
  const entry = mapName ? MAP_ASSET_MAP[normalizeMapSlug(mapName)] : undefined
  return {
    thumb: entry?.thumb ?? null,
    banner: entry?.banner ?? null,
    card: entry?.card ?? null,
  }
}
