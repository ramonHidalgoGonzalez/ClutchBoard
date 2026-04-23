import { redirect } from "next/navigation"

import { LoginButton } from "@/features/auth/login-button"
import { env } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

export default async function LoginPage() {
  const session = await getCurrentSession()

  if (session) {
    redirect("/dashboard")
  }

  if (env.demoAutoLogin) {
    redirect("/api/auth/riot/login")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.2),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_55%,#050816_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Acceso seguro</p>
          <h1 className="mt-3 text-4xl font-semibold">Iniciar sesion con Riot</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            El flujo real usa Riot Sign On con validación de `state`, cookies `httpOnly`, sesión firmada y
            almacenamiento opcional en PostgreSQL. Si `ENABLE_MOCK_RIOT=true`, el login entra en modo demo sin
            necesidad de aprobación final de Riot.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LoginButton />
        </div>
      </div>
    </main>
  )
}
