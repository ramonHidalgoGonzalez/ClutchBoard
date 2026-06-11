import { Badge } from "@/components/ui/badge"

type MatchResultBadgeProps = {
  outcome: "win" | "loss" | "draw" | "unknown"
}

export function MatchResultBadge({ outcome }: MatchResultBadgeProps) {
  const styles =
    outcome === "win"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : outcome === "loss"
        ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
        : outcome === "draw"
          ? "border-sky-300/40 bg-sky-500/15 text-sky-100"
          : "border-zinc-400/40 bg-zinc-500/15 text-zinc-200"

  return (
    <Badge variant="outline" className={styles}>
      {outcome}
    </Badge>
  )
}
