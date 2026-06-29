"use client"

/**
 * usePlanningSetCurrency — the display currency + locale for a planning set,
 * resolved from the set's record-true jurisdiction (`planning_sets.country_code`,
 * persisted by the wizard, FIX I52). Falls back to GBP/en-GB for legacy sets
 * with no country. Lets every set sub-page localise its money with one line
 * instead of hardcoding `£`.
 */

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { getCountryPack } from "@/lib/i18n/country-packs"

export interface PlanningSetCurrency {
  currency: string
  locale: string
  countryCode: string
}

export function usePlanningSetCurrency(setId: string | undefined): PlanningSetCurrency {
  const { data } = useQuery({
    queryKey: ["planning-set-currency", setId],
    queryFn: async () => {
      if (!setId) return null
      const { data, error } = await createClient()
        .from("planning_sets")
        .select("country_code")
        .eq("id", setId)
        .maybeSingle()
      if (error) return null
      return (data?.country_code as string | null) ?? null
    },
    enabled: !!setId,
    staleTime: 5 * 60 * 1000,
  })

  const countryCode = (data || "GB").toUpperCase()
  const pack = getCountryPack(countryCode)
  return { currency: pack.currency || "GBP", locale: pack.locale || "en-GB", countryCode }
}
