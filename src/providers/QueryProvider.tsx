"use client"

import React, { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * Wraps the app with TanStack Query's QueryClientProvider.
 *
 * A new QueryClient is created once per session (via useState) so it is
 * stable across re-renders but not shared between server-side renders.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 60 seconds — avoids excessive refetches
            staleTime: 60 * 1000,
            // Keep unused cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry once on failure (avoids hammering on auth errors)
            retry: 1,
            // Don't refetch when window regains focus in dev
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
