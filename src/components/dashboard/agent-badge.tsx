import { Badge } from "@/components/ui/badge"
import { AgentAvatar } from "@/components/dashboard/agent-avatar"

export function AgentBadge({ name, imageUrl, iconUrl }: { name?: string; imageUrl?: string | null; iconUrl?: string | null }) {
  return (
    <Badge variant="outline" className="h-auto gap-2 border-indigo-300/35 bg-indigo-500/15 py-1 text-indigo-100">
      <AgentAvatar name={name} imageUrl={imageUrl} iconUrl={iconUrl} size="sm" />
      <span>{name || "Unknown Agent"}</span>
    </Badge>
  )
}
