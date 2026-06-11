import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-xl bg-white/10" />
      ))}
    </div>
  )
}
