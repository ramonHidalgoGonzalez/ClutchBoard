export type MapVisualInput = {
  mapImageUrl?: string | null
  mapIconUrl?: string | null
  splashUrl?: string | null
  listViewIconUrl?: string | null
}

export type MapVisuals = {
  thumbnailUrl: string | null
  bannerUrl: string | null
  heroUrl: string | null
}

/**
 * Context-specific map imagery. Maps expose a single landscape splash (16:9),
 * so the same source is rendered differently per context (thumbnail / banner /
 * hero). Prefers the splash, then the list-view icon. Never returns an internal
 * engine path — those are filtered upstream in content resolution.
 */
export function getMapVisuals(map: MapVisualInput): MapVisuals {
  const splash = map.splashUrl ?? map.mapImageUrl ?? null
  const icon = map.listViewIconUrl ?? map.mapIconUrl ?? null
  const primary = splash ?? icon

  return {
    thumbnailUrl: primary,
    bannerUrl: primary,
    heroUrl: primary,
  }
}
