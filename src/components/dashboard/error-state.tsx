"use client"

import type { ReactNode } from "react"

import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ErrorStateProps = {
  title: string
  description: string
  technicalDetails?: string
  onRetry?: () => void
  actions?: ReactNode
}

export function ErrorState({ title, description, technicalDetails, onRetry, actions }: ErrorStateProps) {
  return (
    <Card className="border-rose-300/25 bg-rose-500/10 text-rose-100">
      <CardContent className="space-y-3 py-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-rose-100/90">{description}</p>
          </div>
        </div>
        {technicalDetails ? (
          <details className="rounded-xl border border-rose-200/25 bg-black/20 p-3 text-xs text-rose-100/85">
            <summary className="cursor-pointer font-medium">Detalle tecnico</summary>
            <p className="mt-2 break-words">{technicalDetails}</p>
          </details>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {onRetry ? (
            <Button size="sm" variant="outline" className="border-rose-200/25 bg-rose-200/10 text-rose-50" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
          {actions}
        </div>
      </CardContent>
    </Card>
  )
}
