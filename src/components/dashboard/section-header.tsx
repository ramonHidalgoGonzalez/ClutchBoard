import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {description ? <p className="text-sm text-zinc-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
