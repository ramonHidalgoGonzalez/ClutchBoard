"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <TooltipProvider>{children}</TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
