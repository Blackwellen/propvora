'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isFeatureEnabled } from '@/lib/flags'
import type { V2FlagKey } from '@/lib/flags/registry'

/**
 * Client-side feature-flag accessor for `"use client"` components that need to
 * hide/show flag-gated UI (e.g. links into a V2 surface that is off by default).
 *
 * Mirrors the server `isFeatureEnabled` resolution (workspace override → global
 * row → registry default) and honours `NEXT_PUBLIC_QA_ALL_FLAGS=true`. Tolerant
 * by design: any error collapses to the registry default (OFF for V2 flags), so
 * a flagged surface stays hidden rather than exposing a dead link.
 *
 * While loading it returns `false` — callers should treat "not yet known" as
 * "hidden", which is the safe default for off-by-default V2 surfaces.
 */
export function useFeatureFlag(flag: V2FlagKey): boolean {
  const supabase = createClient()
  const { data } = useQuery<boolean>({
    queryKey: ['feature_flag', flag],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        return await isFeatureEnabled(flag, { supabase })
      } catch {
        return false
      }
    },
  })
  return data ?? false
}
