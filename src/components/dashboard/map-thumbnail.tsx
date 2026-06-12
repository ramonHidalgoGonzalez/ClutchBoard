"use client"

import { useState } from "react"
import Image from "next/image"

import { MapPinned } from "lucide-react"

import { cn } from "@/lib/utils"

type MapThumbnailProps = {
  name?: string
  imageUrl?: string | null
  iconUrl?: string | null
  className?: string
}

export function MapThumbnail({ name, imageUrl, iconUrl, className }: MapThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl || iconUrl : null

  return (
    <div
      className={cn(
        "relative h-10 w-16 overflow-hidden rounded-lg border border-white/15 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20",
        className,
      )}
      aria-label={name || "Unknown Map"}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "Unknown Map"}
          fill
          sizes="96px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-white">
          <MapPinned className="size-3.5" />
        </div>
      )}
    </div>
  )
}
