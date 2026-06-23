"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

type MapThumbnailProps = {
  name?: string
  imageUrl?: string | null
  iconUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const SIZE_CLASS = {
  xs: "h-8 w-12", // 48x32
  sm: "h-10 w-16", // 64x40
  md: "h-12 w-20", // 80x48
  lg: "h-[90px] w-40", // 160x90
}

function shortLabel(name?: string) {
  if (!name) {
    return "MAP"
  }
  return name.split(" ")[0]
}

export function MapThumbnail({ name, imageUrl, iconUrl, size = "md", className }: MapThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl || iconUrl : null
  const label = name || "Unknown Map"
  const big = size === "lg" || size === "md"

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[linear-gradient(135deg,#0f172a,#164e63)] shadow-[0_4px_18px_rgba(8,47,73,0.35)]",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={label}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={() => setFailed(true)}
          />
          {/* keep imagery bright: only a faint bottom vignette for legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center">
          <span
            className={cn(
              "truncate font-semibold uppercase tracking-wide text-white/90",
              big ? "text-xs" : "text-[10px]",
            )}
          >
            {big ? label : shortLabel(name)}
          </span>
        </div>
      )}
    </div>
  )
}
