import { tierStyle, tierSub } from "@/lib/valorant-ranks"
import { cn } from "@/lib/utils"

/** Gradient rank badge (used until real rank icons are shipped). */
export function RankBadge({ tierId, size = 80, className }: { tierId?: number | null; size?: number; className?: string }) {
  const style = tierStyle(tierId)
  const sub = tierSub(tierId)
  return (
    <div
      className={cn("relative grid place-items-center rounded-2xl border border-white/15", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 25%, ${style.accent}55, transparent 60%), linear-gradient(150deg, ${style.from}, ${style.to})`,
        boxShadow: `0 12px 36px -12px ${style.from}aa`,
      }}
      aria-hidden="true"
    >
      <div
        className="size-1/2 rotate-45 rounded-[18%] border-2"
        style={{ borderColor: style.accent, background: `linear-gradient(150deg, ${style.from}, ${style.to})` }}
      />
      {sub ? (
        <span className="absolute text-sm font-extrabold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
          {sub}
        </span>
      ) : null}
    </div>
  )
}
