import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { Badge } from "@/components/ui/badge"
import { cleanMapName } from "@/lib/valorant-content"

export function MapBadge({ name, imageUrl, iconUrl }: { name?: string; imageUrl?: string | null; iconUrl?: string | null }) {
  const label = cleanMapName(name || "Unknown Map")

  return (
    <Badge variant="outline" className="h-auto max-w-full gap-2 border-cyan-300/35 bg-cyan-500/15 py-1 pr-3 text-cyan-100">
      <MapThumbnail name={label} imageUrl={imageUrl} iconUrl={iconUrl} size="sm" />
      <span className="truncate">{label}</span>
    </Badge>
  )
}
