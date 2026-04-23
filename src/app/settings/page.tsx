import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { env } from "@/lib/env"
import { requireSession } from "@/server/auth/session"

export default async function SettingsPage() {
  const session = await requireSession()

  return (
    <AppShell title="Settings" subtitle="Sesion, sincronizacion y preferencias">
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Cuenta conectada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p>PUUID: {session.puuid}</p>
            <p>Jugador: {session.gameName}#{session.tagLine}</p>
            <p>Modo actual: {env.enableMockRiot ? "mock/demo" : "riot"}</p>
            <p>Cookies `httpOnly` y sesión firmada activas.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild className="rounded-2xl bg-[#ff4655] hover:bg-[#ff5d6a]">
              <a href="/api/sync">Refresh manual</a>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white">
              <a href="/api/auth/logout">Cerrar sesion</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
