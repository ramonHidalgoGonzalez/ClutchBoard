import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"

import { LoginButton } from "@/features/auth/login-button"
import { env, hasRsoClientCredentials } from "@/lib/env"
import { getCurrentSession } from "@/server/auth/session"

type LoginPageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

const ERROR_MESSAGES: Record<string, string> = {
  state: "No se pudo validar la solicitud de Riot. Intentalo otra vez.",
  code: "Riot no devolvio el codigo de autorizacion. Intentalo de nuevo.",
  rso_not_configured:
    "RSO real pendiente de aprobacion/configuracion. Usa modo demo o completa RIOT_RSO_CLIENT_ID y RIOT_RSO_CLIENT_SECRET.",
  rso_unavailable: "No se pudo iniciar Riot Sign On en este momento.",
  rso_exchange: "No se pudo completar el intercambio de codigo con Riot.",
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getCurrentSession()
  const params = await searchParams
  const error = params.error
  const isRsoPending = !env.enableMockRiot && !hasRsoClientCredentials()

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
          <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
            <Image
              src="/brand/clutchboard-mark.svg"
              alt="Clutchboard logo"
              width={28}
              height={28}
              className="rounded-md"
              priority
            />
            <span className="text-sm tracking-wide text-zinc-200">Clutchboard</span>
          </div>
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Acceso seguro</p>
          <h1 className="mt-3 text-4xl font-semibold">Iniciar sesion con Riot</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            El flujo real usa Riot Sign On con validación de `state`, cookies `httpOnly`, sesión firmada y
            almacenamiento opcional en PostgreSQL. Si `ENABLE_MOCK_RIOT=true`, el login entra en modo demo sin
            necesidad de aprobación final de Riot.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LoginButton disabled={isRsoPending} />
        </div>
        {isRsoPending ? (
          <p className="text-sm text-zinc-300">
            Login real de Riot pendiente de aprobacion de RSO Client. Mientras tanto, habilita modo demo
            (`ENABLE_MOCK_RIOT=true`) para validar UX y flujo interno.
          </p>
        ) : null}
        {error && ERROR_MESSAGES[error] ? (
          <div className="rounded-xl border border-rose-300/35 bg-rose-500/10 p-3 text-sm text-rose-100">
            {ERROR_MESSAGES[error]}
          </div>
        ) : null}
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Politica de opt-in de jugadores</p>
          <p className="mt-2 text-amber-50/90">
            Clutchboard solo muestra datos y estadisticas de jugadores que se registraron y aceptaron
            expresamente compartir su informacion. Las cuentas sin alta previa no se publican.
          </p>
          <p className="mt-3 text-amber-50/90">
            Al usar esta plataforma aceptas nuestra{" "}
            <Link href="/privacidad" className="underline underline-offset-2 hover:text-white">
              Politica de Privacidad
            </Link>{" "}
            y nuestros{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-white">
              Terminos de Servicio
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
