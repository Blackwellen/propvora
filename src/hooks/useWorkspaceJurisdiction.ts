'use client'

/**
 * useWorkspaceJurisdiction — reads the active workspace's i18n settings from
 * the AuthProvider context (no extra API call). Returns currency, locale,
 * dateFormat, and timezone with GB-safe defaults when not yet configured.
 *
 * FIX-291: Created as part of i18n 100/100 gap-fill. Reads from
 * workspace.settings (JSONB column already in the DB schema).
 */

import { useWorkspace } from '@/providers/AuthProvider'
import type { WorkspaceSettings } from '@/providers/AuthProvider'

export interface WorkspaceJurisdiction {
  /** ISO-3166-1 alpha-2 country code (default GB) */
  countryCode: string
  /** ISO-4217 currency code (default GBP) */
  currency: string
  /** BCP-47 locale tag (default en-GB) */
  locale: string
  /** Date display format string (default DD/MM/YYYY) */
  dateFormat: string
  /** IANA timezone (default Europe/London) */
  timezone: string
  /** True while workspace is still loading */
  isLoading: boolean
  /** Raw settings object from workspace.settings JSONB */
  settings: WorkspaceSettings
}

const GB_DEFAULTS: Required<Omit<WorkspaceSettings, 'region'>> = {
  countryCode: 'GB',
  currency: 'GBP',
  locale: 'en-GB',
  dateFormat: 'DD/MM/YYYY',
  timezone: 'Europe/London',
}

export function useWorkspaceJurisdiction(): WorkspaceJurisdiction {
  const { workspace, isLoading } = useWorkspace()
  const raw = (workspace?.settings ?? {}) as WorkspaceSettings & { countryCode?: string; region?: string }

  // Authoritative source is the workspaces.* columns written by Workspace
  // Settings → Jurisdiction (business_country_code / default_currency /
  // default_language). The JSONB `settings` object is a back-compat fallback so
  // workspaces configured the old way still resolve. Without this, choosing a
  // non-GB country never reached the compliance/legal/tax UI (it kept reading
  // settings.countryCode, which the settings page never wrote).
  return {
    countryCode: workspace?.business_country_code || raw.countryCode || GB_DEFAULTS.countryCode,
    currency: workspace?.default_currency || raw.currency || GB_DEFAULTS.currency,
    locale: workspace?.default_language || raw.locale || GB_DEFAULTS.locale,
    dateFormat: raw.dateFormat || GB_DEFAULTS.dateFormat,
    timezone: raw.timezone || GB_DEFAULTS.timezone,
    isLoading,
    settings: raw,
  }
}

/** Convenience hook — returns just the countryCode. */
export function useCountryCode(): string {
  return useWorkspaceJurisdiction().countryCode
}

/** Convenience hook — returns just the currency code (e.g. "GBP"). */
export function useWorkspaceCurrency(): string {
  return useWorkspaceJurisdiction().currency
}
