import { getRankAsset, tierStyle } from "@/lib/valorant-ranks"
import { cn } from "@/lib/utils"

/** Rank badge using the local rank icon, with a gradient fallback behind it. */
export function RankBadge({ tierId, size = 80, className }: { tierId?: number | null; size?: number; className?: string }) {
  const style = tierStyle(tierId)
  const src = getRankAsset(tierId)

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-[14%] rounded-full opacity-50 blur-md"
        style={{ background: `radial-gradient(circle, ${style.accent}, transparent 70%)` }}
      />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="relative h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" />
      ) : null}
    </div>
  )
}
