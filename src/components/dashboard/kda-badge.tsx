import { Badge } from "@/components/ui/badge"

export function KdaBadge({ kills, deaths, assists }: { kills?: number; deaths?: number; assists?: number }) {
  return (
    <Badge variant="outline" className="border-white/20 bg-white/10 text-zinc-100">
      {kills ?? 0}/{deaths ?? 0}/{assists ?? 0}
    </Badge>
  )
}
