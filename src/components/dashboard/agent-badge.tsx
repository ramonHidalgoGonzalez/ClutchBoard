import { AgentAvatar } from "@/components/dashboard/agent-avatar"
import { Badge } from "@/components/ui/badge"

export function AgentBadge({ name, imageUrl, iconUrl }: { name?: string; imageUrl?: string | null; iconUrl?: string | null }) {
  const label = name || "Unknown Agent"

  return (
    <Badge variant="outline" className="h-auto max-w-full gap-2 border-indigo-300/35 bg-indigo-500/15 py-1 pr-3 text-indigo-100">
      <AgentAvatar name={label} imageUrl={imageUrl} iconUrl={iconUrl} size="sm" />
      <span className="truncate">{label}</span>
    </Badge>
  )
}
