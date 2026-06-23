import { ChartSkeleton, DonutSkeleton } from "@/components/charts/chart-skeleton"
import { cn } from "@/lib/utils"

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-white/[0.06]", className)} />
}

function Card({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.02] p-4", className)}>{children}</div>
  )
}

export function StatRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Block className="h-3 w-16" />
          <Block className="h-7 w-20" />
          <Block className="h-2 w-12" />
        </Card>
      ))}
    </div>
  )
}

export function RowSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <Block className="size-14 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Block className="h-3 w-28" />
            <Block className="h-2 w-20" />
          </div>
          <Block className="hidden h-8 w-16 sm:block" />
          <Block className="hidden h-8 w-16 md:block" />
          <Block className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 8, tall = false }: { count?: number; tall?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Block className={tall ? "h-40 w-full rounded-xl" : "h-24 w-full rounded-xl"} />
          <Block className="h-4 w-24" />
          <div className="flex gap-2">
            <Block className="h-6 w-14" />
            <Block className="h-6 w-14" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function ScopeBar() {
  return (
    <div className="flex justify-end">
      <Block className="h-9 w-56 rounded-lg" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <StatRowSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <ChartSkeleton height={260} />
        </Card>
        <Card className="grid place-items-center">
          <DonutSkeleton />
        </Card>
      </div>
      <RowSkeleton rows={5} />
    </div>
  )
}

export function MatchHistorySkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <StatRowSkeleton count={4} />
      <Block className="h-10 w-full max-w-sm rounded-lg" />
      <RowSkeleton rows={10} />
    </div>
  )
}

export function AgentGridSkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <CardGridSkeleton count={10} tall />
    </div>
  )
}

export function MapGridSkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <CardGridSkeleton count={8} tall />
    </div>
  )
}

export function RankedSkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="grid place-items-center">
          <Block className="size-28 rounded-full" />
        </Card>
        <Card className="lg:col-span-2 space-y-3">
          <Block className="h-4 w-40" />
          <ChartSkeleton height={220} />
        </Card>
      </div>
      <Card className="grid place-items-center">
        <DonutSkeleton />
      </Card>
    </div>
  )
}

export function ComparisonSkeleton() {
  return (
    <div className="space-y-5">
      <ScopeBar />
      <div className="flex gap-2">
        <Block className="h-9 w-32 rounded-lg" />
        <Block className="h-9 w-32 rounded-lg" />
      </div>
      <Card>
        <ChartSkeleton height={280} />
      </Card>
      <StatRowSkeleton count={4} />
    </div>
  )
}

export function ImprovementSkeleton() {
  return (
    <div className="space-y-6">
      <ScopeBar />
      <StatRowSkeleton count={4} />
      <CardGridSkeleton count={4} />
    </div>
  )
}
