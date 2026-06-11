import { Badge } from "@/components/ui/badge"

export function MapBadge({ name }: { name?: string }) {
  return (
    <Badge variant="outline" className="border-cyan-300/35 bg-cyan-500/15 text-cyan-100">
      {name || "Unknown Map"}
    </Badge>
  )
}
