"use client"

import { useState } from "react"
import Image from "next/image"

import { MapPinned } from "lucide-react"

import { cn } from "@/lib/utils"

type MapThumbnailProps = {
  name?: string
  imageUrl?: string | null
  iconUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_CLASS = {
  sm: "h-7 w-10",
  md: "h-10 w-16",
  lg: "h-14 w-24",
}

const SIZE_HINT = {
  sm: "40px",
  md: "64px",
  lg: "96px",
}

function shortLabel(name?: string) {
  if (!name) {
    return "MAP"
  }

  return name.slice(0, 3).toUpperCase()
}

export function MapThumbnail({ name, imageUrl, iconUrl, size = "md", className }: MapThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl || iconUrl : null
  const label = name || "Unknown Map"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.38),transparent_40%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(59,130,246,0.35))] shadow-[0_10px_28px_rgba(8,47,73,0.28)]",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={label}
    >
      {src ? (
        // Use native <img> for SVGs or internal media endpoints to avoid Next Image SVG restrictions
        (src.endsWith(".svg") || src.startsWith("/api/media")) ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />
        ) : (
          <Image
            src={src}
            alt={label}
            fill
            loading="lazy"
            sizes={SIZE_HINT[size]}
            className="object-cover"
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center gap-1 bg-black/10 px-2 text-[10px] font-semibold tracking-[0.24em] text-white/90">
          <MapPinned className="size-3.5" />
          <span>{shortLabel(name)}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
    </div>
  )
}
