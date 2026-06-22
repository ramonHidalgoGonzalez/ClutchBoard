"use client"

import { useState } from "react"
import Image from "next/image"

import { UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

type AgentAvatarProps = {
  name?: string
  imageUrl?: string | null
  iconUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_CLASS = {
  sm: "size-8",
  md: "size-10",
  lg: "size-16",
}

const SIZE_HINT = {
  sm: "32px",
  md: "40px",
  lg: "64px",
}

function initials(value?: string) {
  if (!value) {
    return "UA"
  }

  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AgentAvatar({ name, imageUrl, iconUrl, size = "md", className }: AgentAvatarProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl || iconUrl : null
  const label = name || "Unknown Agent"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(circle_at_top,#fb718566,transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(56,189,248,0.22))] shadow-[0_10px_30px_rgba(15,23,42,0.28)]",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={label}
    >
      {src ? (
        // Use native <img> for all agent media to avoid Next/Image domain and SVG issues
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black/10 text-xs font-semibold text-white">
          {name ? initials(name) : <UserRound className="size-4" />}
        </div>
      )}
    </div>
  )
}
