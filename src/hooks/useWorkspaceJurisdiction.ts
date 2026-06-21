"use client"

import { useWorkspace } from "@/providers/AuthProvider"

export interface WorkspaceJurisdictionResult {
  countryCode: string
  currency: string
  locale: string
  dateFormat: string
  timezone: string
  settings: Record<string, unknown>
}

/**
 * Returns the active workspace's i18n jurisdiction settings.
 * Reads from workspace.settings (populated by AuthProvider via Supabase).
 * Falls back to UK defaults when settings are absent.
 */
export function useWorkspaceJurisdiction(): WorkspaceJurisdictionResult {
  const { workspace } = useWorkspace()
  const settings =
    (workspace?.settings as Record<string, unknown> | undefined | null) ?? {}

  const countryCode = (settings.countryCode as string | undefined) ?? "GB"
  const currency = (settings.currency as string | undefined) ?? "GBP"
  const locale = (settings.locale as string | undefined) ?? "en-GB"
  const dateFormat = (settings.dateFormat as string | undefined) ?? "dd/MM/yyyy"
  const timezone =
    (settings.timezone as string | undefined) ?? "Europe/London"

  return { countryCode, currency, locale, dateFormat, timezone, settings }
}

/**
 * Convenience hook — returns just the countryCode.
 */
export function useCountryCode(): string {
  return useWorkspaceJurisdiction().countryCode
}

/**
 * Convenience hook — returns just the currency code (e.g. "GBP").
 */
export function useWorkspaceCurrency(): string {
  return useWorkspaceJurisdiction().currency
}
