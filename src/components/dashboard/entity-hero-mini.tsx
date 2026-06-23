import Link from "next/link"
import { Star } from "lucide-react"

type EntityHeroMiniProps = {
  kind: "agent" | "map"
  eyebrow: string
  name: string
  imageUrl?: string | null
  winRate?: number | null
  matches?: number
  star?: boolean
  href: string
}

export function EntityHeroMini({
  kind,
  eyebrow,
  name,
  imageUrl,
  winRate,
  matches,
  star = false,
  href,
}: EntityHeroMiniProps) {
  const bgPos = kind === "agent" ? "bg-top" : "bg-center"

  return (
    <Link
      href={href}
      className="group relative block h-40 overflow-hidden rounded-2xl border border-white/10"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#1e293b)]" />
      <div
        className={`absolute inset-y-0 right-0 w-2/3 bg-cover ${bgPos} transition-transform duration-300 group-hover:scale-105`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.96)_8%,rgba(9,9,11,0.55)_55%,transparent_100%)]" />
      {star ? <Star className="absolute right-3 top-3 size-5 fill-amber-300 text-amber-300" /> : null}
      <div className="absolute inset-0 flex flex-col justify-center p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p>
        <p className="mt-1 text-2xl font-extrabold text-white">{name}</p>
        {typeof winRate === "number" ? (
          <p className="mt-1 text-sm font-semibold text-emerald-300">{winRate.toFixed(0)}% Winrate</p>
        ) : null}
        {typeof matches === "number" ? (
          <p className="text-xs text-zinc-400">{matches} Partidas</p>
        ) : null}
      </div>
    </Link>
  )
}
