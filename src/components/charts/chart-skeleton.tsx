import { cn } from "@/lib/utils"

/** Premium chart placeholder: faint gridlines + a shimmering area, no raw grey box. */
export function ChartSkeleton({ className, height = 240 }: { className?: string; height?: number }) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]",
        className,
      )}
      style={{ height }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-px w-full bg-white/10" />
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-4 h-1/2 animate-pulse rounded-md bg-gradient-to-t from-sky-500/15 to-transparent" />
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  )
}

export function DonutSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div className="grid place-items-center" style={{ height: size }} aria-hidden="true">
      <div
        className="animate-pulse rounded-full border-[14px] border-white/10"
        style={{ width: size * 0.8, height: size * 0.8 }}
      />
    </div>
  )
}
