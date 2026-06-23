// VALORANT competitive tier ids (0 unranked, 3..27). Sub-tier = id within the
// group (1..3). RR is NOT exposed by the match endpoint, so we only ever derive
// tier/progression — never invent RR.

type Group = {
  name: string
  file: string
  min: number
  // tailwind-friendly gradient + accent for the fallback badge
  from: string
  to: string
  accent: string
}

const GROUPS: Group[] = [
  { name: "Hierro", file: "iron", min: 3, from: "#52525b", to: "#27272a", accent: "#a1a1aa" },
  { name: "Bronce", file: "bronze", min: 6, from: "#92633b", to: "#5b3f25", accent: "#c08552" },
  { name: "Plata", file: "silver", min: 9, from: "#9ca3af", to: "#52525b", accent: "#cbd5e1" },
  { name: "Oro", file: "gold", min: 12, from: "#d4a23a", to: "#8a6a1f", accent: "#f0c75e" },
  { name: "Platino", file: "platinum", min: 15, from: "#2dd4bf", to: "#0f766e", accent: "#5eead4" },
  { name: "Diamante", file: "diamond", min: 18, from: "#a78bfa", to: "#6d28d9", accent: "#c4b5fd" },
  { name: "Ascendente", file: "ascendant", min: 21, from: "#34d399", to: "#047857", accent: "#6ee7b7" },
  { name: "Inmortal", file: "immortal", min: 24, from: "#fb7185", to: "#9f1239", accent: "#fda4af" },
  { name: "Radiante", file: "radiant", min: 27, from: "#fde68a", to: "#f59e0b", accent: "#fef3c7" },
]

function groupFor(tierId: number): Group | null {
  if (tierId < 3) return null
  let found: Group | null = null
  for (const g of GROUPS) {
    if (tierId >= g.min) found = g
  }
  return found
}

export function tierName(tierId?: number | null): string | null {
  if (tierId === null || tierId === undefined || tierId < 3) return null
  const g = groupFor(tierId)
  if (!g) return null
  if (g.name === "Radiante") return "Radiante"
  const sub = tierId - g.min + 1
  return `${g.name} ${sub}`
}

export function tierStyle(tierId?: number | null): { from: string; to: string; accent: string } {
  const g = tierId == null ? null : groupFor(tierId)
  return g
    ? { from: g.from, to: g.to, accent: g.accent }
    : { from: "#334155", to: "#0f172a", accent: "#94a3b8" }
}

export function tierSub(tierId?: number | null): string | null {
  if (tierId == null || tierId < 3) return null
  const g = groupFor(tierId)
  if (!g || g.name === "Radiante") return null
  return ["I", "II", "III"][tierId - g.min] ?? null
}

/** Local rank icon path for a tier id (public/valorant/ranks/<group><sub>.png). */
export function getRankAsset(tierId?: number | null): string | null {
  if (tierId === null || tierId === undefined || tierId < 3) {
    return "/valorant/ranks/unranked.png"
  }
  const g = groupFor(tierId)
  if (!g) return "/valorant/ranks/unranked.png"
  if (g.file === "radiant") return "/valorant/ranks/radiant.png"
  const sub = tierId - g.min + 1
  return `/valorant/ranks/${g.file}${sub}.png`
}
