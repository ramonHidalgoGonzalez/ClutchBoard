import { Cloud, Crosshair, Shield, Swords, Sparkles, type LucideIcon } from "lucide-react"

const ROLE_MAP: Array<{ match: string[]; label: string; icon: LucideIcon }> = [
  { match: ["duel"], label: "Duelista", icon: Swords },
  { match: ["initiat", "iniciad"], label: "Iniciador", icon: Crosshair },
  { match: ["controll", "controlad"], label: "Controlador", icon: Cloud },
  { match: ["sentinel", "centinela"], label: "Centinela", icon: Shield },
]

export function resolveRole(role?: string | null) {
  const normalized = (role ?? "").toLowerCase()
  const entry = ROLE_MAP.find((candidate) => candidate.match.some((token) => normalized.includes(token)))
  return entry ?? { label: role || "Agente", icon: Sparkles }
}

export function RoleIcon({ role, className }: { role?: string | null; className?: string }) {
  const { icon: Icon } = resolveRole(role)
  return <Icon className={className} />
}
