import Link from "next/link"
import {
  ArrowLeft,
  Clock,
  Crosshair,
  Sparkles,
  Star,
  Swords,
  Target,
  Zap,
} from "lucide-react"

import { AgentWinrateLine } from "@/components/agents/agent-winrate-line"
import { RankedEntityCard } from "@/components/ranked/ranked-entity-card"
import { resolveRole } from "@/components/agents/role-icon"
import { MapThumbnail } from "@/components/dashboard/map-thumbnail"
import { WinrateDonut } from "@/components/stats/winrate-donut"
import { cn } from "@/lib/utils"
import { toSlug } from "@/lib/slug"
import { getAgentAssets } from "@/server/valorant/assets/agent-assets"
import type { AgentProfile, CompareRow } from "@/server/valorant/analytics/agent-profile"
import type { RankedOverview } from "@/server/valorant/analytics/ranked"
import type { MatchPerformance } from "@/types/domain"

function fmt(value: number | null, kind: "ratio" | "percent" | "int") {
  if (value === null || !Number.isFinite(value)) return "—"
  if (kind === "percent") return `${value.toFixed(1)}%`
  if (kind === "ratio") return value.toFixed(2)
  return Math.round(value).toString()
}

function Delta({ value, kind }: { value: number; kind: "ratio" | "percent" | "int" }) {
  if (Math.abs(value) < 0.05) return null
  const up = value > 0
  const txt = kind === "percent" ? `${Math.abs(value).toFixed(1)}%` : kind === "int" ? Math.round(Math.abs(value)).toString() : Math.abs(value).toFixed(2)
  return <span className={up ? "text-xs font-semibold text-emerald-400" : "text-xs font-semibold text-rose-400"}>{up ? "▲" : "▼"} {txt}</span>
}

function Card({ title, info, children, className }: { title: string; info?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("premium-card p-5", className)}>
      <p className="mb-4 flex items-center gap-1.5 text-sm font-bold uppercase tracking-[0.12em] text-zinc-300">
        {title} {info ? <span className="text-zinc-600">ⓘ</span> : null}
      </p>
      {children}
    </div>
  )
}

const CMP_ICON: Record<string, typeof Crosshair> = { kd: Swords, acs: Star, hs: Target, kills: Crosshair, fb: Zap }

export function AgentDetail({
  name,
  role,
  profile,
  isTop,
  now,
  ranked,
}: {
  name: string
  role?: string | null
  profile: AgentProfile
  isTop: boolean
  now: number
  ranked: { overview: RankedOverview; bestMap?: string | null; worstMap?: string | null }
}) {
  const roleInfo = resolveRole(role)
  const RoleGlyph = roleInfo.icon
  const hero = getAgentAssets(name).hero ?? getAgentAssets(name).card
  const d = profile.deltas

  return (
    <div className="space-y-5">
      <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="size-4" /> Volver a agentes
      </Link>

      {/* Header */}
      <section className="premium-card overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[260px_1fr_300px]">
          <div className="relative h-60 overflow-hidden rounded-2xl border border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fb718533,transparent_55%),linear-gradient(160deg,#1e293b,#0b1020)]" />
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt={name} className="absolute inset-0 h-full w-full object-cover object-top" />
            ) : null}
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-5xl font-extrabold leading-none text-white">{name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-300">
              <RoleGlyph className="size-4 text-rose-300" /> {roleInfo.label}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-6">
              <HeaderStat label="Partidas" value={String(profile.games)} />
              <HeaderStat label="Winrate" value={`${profile.winRate.toFixed(1)}%`} delta={d.available ? <Delta value={d.winRate} kind="percent" /> : null} />
              <HeaderStat label="K/D" value={profile.kd.toFixed(2)} delta={d.available ? <Delta value={d.kd} kind="ratio" /> : null} />
              <HeaderStat label="ACS" value={profile.avgAcs.toFixed(0)} delta={d.available ? <Delta value={d.acs} kind="int" /> : null} />
              <HeaderStat label="HS%" value={`${profile.hsPct.toFixed(1)}%`} delta={d.available ? <Delta value={d.hs} kind="percent" /> : null} />
              <HeaderStat label="Tiempo jugado" value={profile.playtime} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="premium-card flex items-center gap-3 p-4">
              <Star className="size-7 text-amber-300" />
              <div>
                <p className="text-xs text-zinc-400">{isTop ? "Agente más jugado" : "Cuota de uso"}</p>
                <p className="text-2xl font-extrabold text-white">{profile.sharePct.toFixed(1)}%</p>
                <p className="text-xs text-zinc-500">de tus partidas</p>
              </div>
            </div>
            <div className="premium-card flex items-center gap-3 p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-500/20 text-xl font-extrabold text-violet-200">
                {profile.grade.letter}
              </span>
              <div>
                <p className="text-xs text-zinc-400">Rating personal</p>
                <p className="text-2xl font-extrabold text-white">{profile.grade.letter}</p>
                <p className="text-xs text-emerald-300">{profile.grade.label}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RankedEntityCard
        title={`Rendimiento ranked con ${name}`}
        overview={ranked.overview}
        splitNoun="mapa"
        bestName={ranked.bestMap}
        worstName={ranked.worstMap}
      />

      {/* Row 2 */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Rendimiento general" info>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <WinrateDonut value={profile.winRate} size={120} stroke={12} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white">{profile.winRate.toFixed(1)}%</span>
                <span className="text-[11px] text-zinc-400">Winrate</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Mini label="Victorias" value={String(profile.wins)} tone="text-emerald-300" />
                <Mini label="Derrotas" value={String(profile.losses)} tone="text-rose-300" />
                <Mini label="Empates" value={String(profile.draws)} tone="text-zinc-300" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
                  <p className="text-[10px] uppercase text-zinc-500">Rondas ganadas</p>
                  <p className="font-bold text-emerald-300">
                    {profile.roundsWon}{" "}
                    <span className="text-xs text-zinc-500">
                      ({Math.round((profile.roundsWon / Math.max(1, profile.roundsWon + profile.roundsLost)) * 100)}%)
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-2 text-center">
                  <p className="text-[10px] uppercase text-zinc-500">Rondas perdidas</p>
                  <p className="font-bold text-rose-300">
                    {profile.roundsLost}{" "}
                    <span className="text-xs text-zinc-500">
                      ({Math.round((profile.roundsLost / Math.max(1, profile.roundsWon + profile.roundsLost)) * 100)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="mb-1 mt-4 text-xs font-semibold text-zinc-400">Evolución del winrate</p>
          {profile.winrateEvolution.length >= 2 ? <AgentWinrateLine data={profile.winrateEvolution} /> : null}
        </Card>

        <Card title="Comparativa con tu promedio general" info>
          <div className="space-y-1">
            {profile.comparison.map((row) => (
              <CompareLine key={row.key} row={row} />
            ))}
          </div>
          {profile.percentile !== null ? (
            <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-center text-xs text-zinc-400">
              Rendimiento en el percentil <span className="font-semibold text-emerald-300">{profile.percentile}</span> de tus partidas.
            </p>
          ) : null}
        </Card>

        <Card title="Mejores y peores mapas" info>
          <MapSplitRow eyebrow="Mejor mapa" tone="emerald" split={profile.bestMap} />
          <div className="my-3 border-t border-white/10" />
          <MapSplitRow eyebrow="Peor mapa" tone="rose" split={profile.worstMap} />
          <Link href="/maps" className="mt-4 block rounded-xl border border-rose-500/30 bg-rose-500/15 py-2 text-center text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
            Ver todos los mapas
          </Link>
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title={`Últimas partidas con ${name}`}>
          <div className="space-y-2">
            {profile.recent.map((m) => (
              <RecentRow key={m.matchId} match={m} now={now} />
            ))}
          </div>
          <Link href="/matches" className="mt-4 block rounded-xl border border-rose-500/30 bg-rose-500/15 py-2 text-center text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
            Ver historial completo
          </Link>
        </Card>

        <Card title={`Fortalezas con ${name}`} info>
          <div className="space-y-3">
            {profile.strengths.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{s.label}</span>
                  <span className="font-semibold text-white">{s.percentile}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={cn("h-full rounded-full", s.percentile >= 60 ? "bg-emerald-400" : s.percentile >= 40 ? "bg-amber-400" : "bg-rose-400")}
                    style={{ width: `${Math.max(4, Math.min(100, s.percentile))}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">Percentil {s.percentile}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Uso de habilidades" info>
          {profile.abilities.length ? (
            <>
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500">
                <span>Habilidad</span>
                <span className="flex gap-8">
                  <span>Usos / Ronda</span>
                  <span>Impacto</span>
                </span>
              </div>
              <div className="space-y-2">
                {profile.abilities.map((a) => (
                  <div key={a.label} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-white">
                      <Sparkles className="size-4 text-rose-300" /> {a.label}
                    </span>
                    <span className="flex items-center gap-8">
                      <span className="w-12 text-right font-semibold text-white">{a.perRound.toFixed(2)}</span>
                      <span className={cn("w-12 text-right font-semibold", a.impact === "Alto" ? "text-emerald-300" : a.impact === "Medio" ? "text-amber-300" : "text-zinc-400")}>
                        {a.impact}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Sin datos de habilidades para estas partidas.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function HeaderStat({ label, value, delta }: { label: string; value: string; delta?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-xl font-extrabold text-white">{value}</p>
      {delta ? <div className="mt-0.5">{delta}</div> : null}
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <p className={cn("text-2xl font-extrabold", tone)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  )
}

function CompareLine({ row }: { row: CompareRow }) {
  const Icon = CMP_ICON[row.key] ?? Crosshair
  return (
    <div className="flex items-center gap-3 border-b border-white/5 py-2 last:border-0">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-rose-300">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-sm text-zinc-300">{row.label}</span>
      <span className="w-14 text-right font-bold text-white">{fmt(row.value, row.format)}</span>
      <span className="w-6 text-center text-[10px] text-zinc-600">vs</span>
      <span className="w-14 text-right text-zinc-400">{fmt(row.avg, row.format)}</span>
      <span className="w-14 text-right">{row.delta !== null ? <Delta value={row.delta} kind={row.format} /> : null}</span>
    </div>
  )
}

function MapSplitRow({ eyebrow, tone, split }: { eyebrow: string; tone: "emerald" | "rose"; split: AgentProfile["bestMap"] }) {
  if (!split) return <p className="text-sm text-zinc-500">{eyebrow}: sin datos suficientes.</p>
  const wrTone = tone === "emerald" ? "text-emerald-300" : "text-rose-300"
  return (
    <div>
      <p className={cn("mb-2 text-xs font-semibold", wrTone)}>● {eyebrow}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a,#164e63)]" />
          {split.banner ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${split.banner})` }} aria-hidden="true" />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.85))]" />
          <span className="absolute bottom-1 left-2 text-xs font-bold text-white">{split.name}</span>
        </div>
        <div className="flex flex-1 items-center justify-between text-center text-sm">
          <div>
            <p className={cn("font-bold", wrTone)}>{split.winRate.toFixed(1)}%</p>
            <p className="text-[10px] uppercase text-zinc-500">Winrate</p>
          </div>
          <div>
            <p className="font-bold text-white">{split.kd.toFixed(2)}</p>
            <p className="text-[10px] uppercase text-zinc-500">K/D</p>
          </div>
          <div>
            <p className="font-bold text-white">{split.avgAcs.toFixed(0)}</p>
            <p className="text-[10px] uppercase text-zinc-500">ACS</p>
          </div>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">{split.games} partidas</p>
    </div>
  )
}

function RecentRow({ match, now }: { match: MatchPerformance & { mvp: boolean }; now: number }) {
  const win = match.outcome === "win"
  const days = Math.max(0, Math.round((now - Date.parse(match.startedAt)) / 86400000))
  return (
    <Link href={`/matches/${match.matchId}`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-2 hover:bg-white/5">
      <MapThumbnail name={match.mapName} imageUrl={match.mapThumbImageUrl ?? match.mapImageUrl} iconUrl={match.mapIconUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{match.mapName}</p>
        <p className="text-[11px] text-zinc-500">Hace {days === 0 ? "hoy" : `${days} día${days === 1 ? "" : "s"}`}</p>
      </div>
      <div className="text-center">
        <p className={cn("text-xs font-bold", win ? "text-emerald-400" : "text-rose-400")}>{win ? "VICTORIA" : "DERROTA"}</p>
        <p className="text-xs text-zinc-300">{match.kills} / {match.deaths} / {match.assists}</p>
      </div>
      <div className="w-12 text-right">
        <p className="text-[10px] uppercase text-zinc-500">ACS</p>
        <p className="text-sm font-bold text-white">{match.acsEstimate ?? "--"}</p>
      </div>
      {match.mvp ? <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">MVP</span> : null}
    </Link>
  )
}
