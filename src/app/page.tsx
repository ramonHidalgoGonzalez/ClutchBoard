import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

export default async function Home() {
  const session = await getCurrentSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.2),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_55%,#050816_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Badge className="bg-white/10 text-zinc-100">Riot RSO + analytics derivadas explicables</Badge>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300">
            {env.enableMockRiot ? "Modo demo activado" : "Modo Riot real"}
          </Badge>
        </div>
        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight">
              Tu cuenta de VALORANT, convertida en un dashboard premium de rendimiento y mejora.
            </h1>
            <p className="max-w-2xl text-lg text-zinc-300">
              Login con Riot, cliente tipado de la API oficial, metricas derivadas documentadas y una capa de coaching
              explicable para detectar debilidades, tendencias y oportunidades reales de mejora.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
                <Link href="/login">Entrar con Riot</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl border-white/10 bg-white/5 text-white"
              >
                <Link href="/dashboard">Ver demo</Link>
              </Button>
            </div>
          </div>
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Incluye</p>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li>Dashboard general con KPIs, tendencias, agentes y mapas.</li>
                <li>Historial de partidas con comparativa frente a tu baseline.</li>
                <li>Modo Mejora con hallazgos, confianza y evidencias.</li>
                <li>Arquitectura preparada para PostgreSQL, Redis, cron jobs y produccion.</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
