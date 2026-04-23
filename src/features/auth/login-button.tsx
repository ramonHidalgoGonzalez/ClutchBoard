"use client"

import { useTransition } from "react"

import { Loader2, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"

export function LoginButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      size="lg"
      className="h-12 rounded-2xl bg-[#ff4655] px-6 text-white hover:bg-[#ff5d6a]"
      onClick={() =>
        startTransition(() => {
          window.location.href = "/api/auth/riot/login"
        })
      }
    >
      {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Shield className="mr-2 size-4" />}
      Iniciar sesion con Riot
    </Button>
  )
}
