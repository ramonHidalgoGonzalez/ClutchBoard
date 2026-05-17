import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terminos de Servicio | Clutchboard",
  description: "Terminos de servicio de Clutchboard.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.15),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_55%,#050816_100%)] px-6 py-10 text-white">
      <article className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-3xl font-semibold">Terminos de Servicio</h1>
        <p className="mt-2 text-sm text-zinc-400">Ultima actualizacion: 17 de mayo de 2026</p>

        <section className="mt-8 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">1. Aceptacion de terminos</h2>
          <p>
            Al usar Clutchboard aceptas estos terminos y nuestras politicas de privacidad aplicables.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">2. Cuenta y acceso</h2>
          <p>
            El acceso puede requerir autenticacion mediante Riot Sign On. Eres responsable de mantener segura
            tu cuenta y de las acciones realizadas con ella.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">3. Uso permitido</h2>
          <p>
            No puedes usar el servicio para scraping no autorizado, abuso de APIs, fraude o cualquier actividad
            que incumpla normas legales o las politicas de Riot.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">4. Opt-in y visibilidad de datos</h2>
          <p>
            Solo se muestran datos de jugadores que se registraron y aceptaron compartir sus datos en el
            servicio. Las cuentas no registradas no se exponen a otros usuarios.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">5. Limitacion de responsabilidad</h2>
          <p>
            El servicio se ofrece tal cual y puede cambiar, suspenderse o interrumpirse sin previo aviso en
            casos tecnicos, operativos o regulatorios.
          </p>
        </section>

        <div className="mt-10">
          <Link href="/login" className="text-sm text-zinc-300 underline underline-offset-2 hover:text-white">
            Volver al login
          </Link>
        </div>
      </article>
    </main>
  )
}
