import { Badge } from "@/components/ui/badge"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"

export function MapBadge({ name, imageUrl, iconUrl }: { name?: string; imageUrl?: string | null; iconUrl?: string | null }) {
  return (
    <Badge variant="outline" className="h-auto gap-2 border-cyan-300/35 bg-cyan-500/15 py-1 text-cyan-100">
      <MapThumbnail name={name} imageUrl={imageUrl} iconUrl={iconUrl} className="h-6 w-9" />
      <span>{name || "Unknown Map"}</span>
    </Badge>
  )
}
