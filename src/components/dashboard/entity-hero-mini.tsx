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
      className="group relative block h-44 overflow-hidden rounded-2xl border border-white/10"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#1e293b)]" />
      <div
        className={`absolute inset-0 bg-cover ${bgPos} transition-transform duration-300 group-hover:scale-105`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        aria-hidden="true"
      />
      {/* light left-to-right scrim: keep the artwork visible, text still legible */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.88)_0%,rgba(9,9,11,0.45)_48%,rgba(9,9,11,0.05)_100%)]" />
      {star ? <Star className="absolute right-3 top-3 size-5 fill-amber-300 text-amber-300 drop-shadow" /> : null}
      <div className="absolute inset-0 flex flex-col justify-center p-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-300">{eyebrow}</p>
        <p className="mt-1 text-3xl font-extrabold text-white drop-shadow">{name}</p>
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
