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

function Overlay({ winRate, matches, eyebrow, name, star }: Pick<EntityHeroMiniProps, "winRate" | "matches" | "eyebrow" | "name" | "star">) {
  return (
    <>
      {star ? (
        <Star className="absolute right-3 top-3 z-10 size-5 fill-amber-300 text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
      ) : null}
      <div className="absolute inset-0 z-10 flex flex-col justify-center p-5 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-200">{eyebrow}</p>
        <p className="mt-1 text-3xl font-extrabold text-white">{name}</p>
        {typeof winRate === "number" ? (
          <p className="mt-1 text-sm font-semibold text-emerald-300">{winRate.toFixed(0)}% Winrate</p>
        ) : null}
        {typeof matches === "number" ? <p className="text-xs text-zinc-200">{matches} Partidas</p> : null}
      </div>
    </>
  )
}

export function EntityHeroMini({ kind, eyebrow, name, imageUrl, winRate, matches, star = false, href }: EntityHeroMiniProps) {
  // Agent: full-body cutout pinned bottom-right, shown whole (no face crop),
  // text on the left over a soft left-side gradient.
  if (kind === "agent") {
    return (
      <Link href={href} className="group relative block h-44 overflow-hidden rounded-2xl border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,#1e1b4b,#0b1020_70%)]" />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="agent-hero-image absolute bottom-0 right-0 h-[125%] w-[55%] transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {/* light left scrim so the character stays bright on the right */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,18,0.92)_0%,rgba(8,10,18,0.45)_45%,rgba(8,10,18,0.12)_100%)]" />
        <Overlay winRate={winRate} matches={matches} eyebrow={eyebrow} name={name} star={star} />
      </Link>
    )
  }

  // Map: landscape splash as a banner background with a moderate left overlay.
  return (
    <Link href={href} className="group relative block h-44 overflow-hidden rounded-2xl border border-white/10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#164e63)]" />
      <div
        className="map-hero-bg absolute inset-0 transition-transform duration-300 group-hover:scale-105"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,10,18,0.92)_0%,rgba(8,10,18,0.45)_50%,rgba(8,10,18,0.15)_100%)]" />
      <Overlay winRate={winRate} matches={matches} eyebrow={eyebrow} name={name} star={star} />
    </Link>
  )
}
