import type { RiotContentDto } from "@/types/riot"

export const MOCK_AGENT_CATALOG: RiotContentDto["characters"] = [
  { id: "astra", name: "Astra" },
  { id: "breach", name: "Breach" },
  { id: "brimstone", name: "Brimstone" },
  { id: "chamber", name: "Chamber" },
  { id: "clove", name: "Clove" },
  { id: "cypher", name: "Cypher" },
  { id: "deadlock", name: "Deadlock" },
  { id: "fade", name: "Fade" },
  { id: "gekko", name: "Gekko" },
  { id: "harbor", name: "Harbor" },
  { id: "iso", name: "Iso" },
  { id: "jett", name: "Jett" },
  { id: "kayo", name: "KAY/O" },
  { id: "killjoy", name: "Killjoy" },
  { id: "miks", name: "Miks" },
  { id: "neon", name: "Neon" },
  { id: "omen", name: "Omen" },
  { id: "phoenix", name: "Phoenix" },
  { id: "raze", name: "Raze" },
  { id: "reyna", name: "Reyna" },
  { id: "sage", name: "Sage" },
  { id: "skye", name: "Skye" },
  { id: "sova", name: "Sova" },
  { id: "tejo", name: "Tejo" },
  { id: "veto", name: "Veto" },
  { id: "viper", name: "Viper" },
  { id: "vyse", name: "Vyse" },
  { id: "waylay", name: "Waylay" },
  { id: "yoru", name: "Yoru" },
]

export const MOCK_MAP_CATALOG: RiotContentDto["maps"] = [
  { id: "abyss", name: "Abyss" },
  { id: "ascent", name: "Ascent" },
  { id: "bind", name: "Bind" },
  { id: "breeze", name: "Breeze" },
  { id: "corrode", name: "Corrode" },
  { id: "fracture", name: "Fracture" },
  { id: "haven", name: "Haven" },
  { id: "icebox", name: "Icebox" },
  { id: "lotus", name: "Lotus" },
  { id: "pearl", name: "Pearl" },
  { id: "split", name: "Split" },
  { id: "sunset", name: "Sunset" },
]

const STANDARD_MAP_NAMES = new Set(
  MOCK_MAP_CATALOG.map((map) => map.name),
)

export function filterStandardMaps<T extends { name: string }>(maps: T[]) {
  return maps.filter((map) => STANDARD_MAP_NAMES.has(map.name))
}
