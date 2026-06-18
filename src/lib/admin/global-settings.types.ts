/** Shared types and defaults for global platform settings (client-safe — no server imports). */

export interface GlobalSettings {
  defaultTimezone: string
  defaultLocale: string
  defaultCurrency: string
  weekStart: string
  productName: string
  supportEmail: string
  supportUrl: string
  systemFromEmail: string
  digestEnabled: boolean
  enforceMfaAdmins: boolean
  sessionTimeoutMins: number
  dataRegion: string
  retentionDays: number
  stripeConfigured: boolean
  resendConfigured: boolean
  supabaseConfigured: boolean
}

export interface GlobalSettingsData {
  notConfigured: boolean
  settings: GlobalSettings
  updatedAt: string | null
}

export const DEFAULT_GLOBAL: GlobalSettings = {
  defaultTimezone: "Europe/London",
  defaultLocale: "en-GB",
  defaultCurrency: "GBP",
  weekStart: "monday",
  productName: "Propvora",
  supportEmail: "support@propvora.com",
  supportUrl: "https://propvora.com/help",
  systemFromEmail: "noreply@propvora.com",
  digestEnabled: true,
  enforceMfaAdmins: true,
  sessionTimeoutMins: 120,
  dataRegion: "uk",
  retentionDays: 365,
  stripeConfigured: false,
  resendConfigured: false,
  supabaseConfigured: false,
}
