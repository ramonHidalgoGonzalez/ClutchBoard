import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Politica de Privacidad | Clutchboard",
  description: "Politica de privacidad y tratamiento de datos de Clutchboard.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,70,85,0.15),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_55%,#050816_100%)] px-6 py-10 text-white">
      <article className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-3xl font-semibold">Politica de Privacidad</h1>
        <p className="mt-2 text-sm text-zinc-400">Ultima actualizacion: 17 de mayo de 2026</p>

        <section className="mt-8 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">1. Datos que recopilamos</h2>
          <p>
            Recopilamos datos de cuenta necesarios para autenticarte con Riot Sign On (RSO) y para mostrar
            tus estadisticas personales dentro de Clutchboard.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">2. Uso de los datos</h2>
          <p>
            Usamos tus datos para ofrecer analitica de rendimiento, historial de partidas e insights
            personalizados dentro del servicio.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">3. Politica de opt-in</h2>
          <p>
            Solo mostramos datos de jugadores que se registraron y dieron consentimiento expreso para su
            visualizacion. Si un jugador no se registra, su informacion no se muestra a terceros en esta app.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">4. Conservacion y seguridad</h2>
          <p>
            Aplicamos medidas razonables para proteger la informacion almacenada. Los datos se conservan solo
            mientras sean necesarios para la operacion del servicio o por obligaciones legales.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-zinc-200">
          <h2 className="text-xl font-medium text-white">5. Contacto</h2>
          <p>
            Para consultas sobre privacidad, contacto o eliminacion de datos, escribe al canal oficial de
            soporte del proyecto.
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
