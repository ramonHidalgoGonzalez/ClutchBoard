import { Badge } from "@/components/ui/badge"

export function AgentBadge({ name }: { name?: string }) {
  return (
    <Badge variant="outline" className="border-indigo-300/35 bg-indigo-500/15 text-indigo-100">
      {name || "Unknown Agent"}
    </Badge>
  )
}
