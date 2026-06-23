"use client"

import { useState } from "react"

import { UserRound } from "lucide-react"

import { cn } from "@/lib/utils"

type AgentAvatarProps = {
  name?: string
  imageUrl?: string | null
  iconUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  /** Tailwind border class (e.g. role-tinted) applied to the container. */
  ringClassName?: string
  /** "bust" zooms onto head/torso (avatars); "full" shows the whole portrait. */
  framing?: "bust" | "full"
}

const SIZE_CLASS = {
  xs: "size-7", // 28
  sm: "size-9", // 36
  md: "size-12", // 48
  lg: "size-[72px]", // 72
  xl: "size-24", // 96
}

const TEXT_CLASS = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
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

export function AgentAvatar({
  name,
  imageUrl,
  iconUrl,
  size = "md",
  className,
  ringClassName,
  framing = "bust",
}: AgentAvatarProps) {
  const [failed, setFailed] = useState(false)
  const src = !failed ? imageUrl || iconUrl : null
  const label = name || "Unknown Agent"
  // Portraits are full-body with transparent margins; zoom onto the upper body
  // so the character fills the frame instead of floating small and centered.
  const imgStyle =
    framing === "bust"
      ? { transform: "scale(1.45)", transformOrigin: "top center" }
      : undefined

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top,#fb718566,transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(56,189,248,0.22))] shadow-[0_6px_20px_rgba(15,23,42,0.3)]",
        ringClassName ?? "border-white/15",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={label}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          style={imgStyle}
          className={
            framing === "bust"
              ? "absolute inset-0 h-full w-full object-cover object-top"
              : "absolute inset-0 h-full w-full object-contain object-bottom"
          }
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-black/10 font-semibold text-white",
            TEXT_CLASS[size],
          )}
        >
          {name ? initials(name) : <UserRound className="size-4" />}
        </div>
      )}
    </div>
  )
}
