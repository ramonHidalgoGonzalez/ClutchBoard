import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import { getArtworkPresentation, getArtworkUrl, getVisualTheme } from "@/lib/game-visuals"
import { cn } from "@/lib/utils"

type StatItem = {
  label: string
  value: string
}

export function GameMediaCard({
  kind,
  name,
  officialAssetPath,
  title,
  subtitle,
  stats,
  footer,
}: {
  kind: "agent" | "map"
  name: string
  officialAssetPath?: string | null
  title: string
  subtitle?: string
  stats: StatItem[]
  footer: string
}) {
  const theme = getVisualTheme(kind, name)
  const artworkUrl = getArtworkUrl(kind, name, officialAssetPath)
  const presentation = getArtworkPresentation(kind, name)

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5 text-white">
      <div
        className="relative h-44 border-b border-white/10"
        style={{
          backgroundColor: theme.surface,
          backgroundImage: `
            radial-gradient(circle at 12% 18%, ${theme.accentFrom}44, transparent 26%),
            radial-gradient(circle at 88% 20%, ${theme.accentTo}55, transparent 28%),
            linear-gradient(135deg, ${theme.accentFrom}18, transparent 48%),
            linear-gradient(315deg, ${theme.accentTo}28, transparent 56%)
          `,
        }}
      >
        <Image
          src={artworkUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={cn("transition-transform duration-300", presentation.imageClassName)}
        />
        <div className={cn("absolute inset-0", presentation.overlayClassName)} />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-300">{theme.eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-zinc-300">{subtitle}</p> : null}
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{stat.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-zinc-400">{footer}</p>
      </CardContent>
    </Card>
  )
}
