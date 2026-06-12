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
  lg: "size-14",
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

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-rose-500/25 to-sky-500/25",
        SIZE_CLASS[size],
        className,
      )}
      aria-label={name || "Unknown Agent"}
    >
      {src ? (
        <Image
          src={src}
          alt={name || "Unknown Agent"}
          fill
          sizes="64px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
          {name ? initials(name) : <UserRound className="size-4" />}
        </div>
      )}
    </div>
  )
}
