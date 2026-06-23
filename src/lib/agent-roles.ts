import { toSlug } from "@/lib/slug"

export type RoleLabel = "Duelista" | "Iniciador" | "Controlador" | "Centinela"

// Agent roles are stable game facts and are NOT returned by the official
// val-content endpoint, so we keep a local map keyed by agent slug.
const AGENT_ROLES: Record<string, RoleLabel> = {
  // Duelistas
  jett: "Duelista",
  phoenix: "Duelista",
  raze: "Duelista",
  reyna: "Duelista",
  yoru: "Duelista",
  neon: "Duelista",
  iso: "Duelista",
  waylay: "Duelista",
  // Iniciadores
  sova: "Iniciador",
  breach: "Iniciador",
  skye: "Iniciador",
  "kay-o": "Iniciador",
  fade: "Iniciador",
  gekko: "Iniciador",
  tejo: "Iniciador",
  // Controladores
  brimstone: "Controlador",
  viper: "Controlador",
  omen: "Controlador",
  astra: "Controlador",
  harbor: "Controlador",
  clove: "Controlador",
  // Centinelas
  killjoy: "Centinela",
  cypher: "Centinela",
  sage: "Centinela",
  chamber: "Centinela",
  deadlock: "Centinela",
  vyse: "Centinela",
}

const ROLE_RING: Record<RoleLabel, string> = {
  Duelista: "border-rose-400/60",
  Iniciador: "border-cyan-400/60",
  Controlador: "border-violet-400/60",
  Centinela: "border-emerald-400/60",
}

/** Tailwind border class tinted by the agent's role (subtle accent). */
export function roleRingClass(agentName?: string | null, contentRole?: string | null) {
  const role = resolveAgentRole(agentName, contentRole)
  return role ? ROLE_RING[role] : "border-white/15"
}

/** Resolve a Spanish role label for an agent, preferring live content role. */
export function resolveAgentRole(agentName?: string | null, contentRole?: string | null): RoleLabel | null {
  const normalized = (contentRole ?? "").toLowerCase()
  if (normalized.includes("duel")) return "Duelista"
  if (normalized.includes("initiat") || normalized.includes("iniciad")) return "Iniciador"
  if (normalized.includes("controll") || normalized.includes("controlad")) return "Controlador"
  if (normalized.includes("sentinel") || normalized.includes("centinela")) return "Centinela"

  if (agentName) {
    return AGENT_ROLES[toSlug(agentName)] ?? null
  }
  return null
}
