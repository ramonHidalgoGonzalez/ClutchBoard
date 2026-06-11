import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-white/15 bg-black/20 text-zinc-200">
      <CardContent className="space-y-3 py-8 text-center">
        <p className="text-lg font-medium text-white">{title}</p>
        <p className="mx-auto max-w-xl text-sm text-zinc-400">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </CardContent>
    </Card>
  )
}
