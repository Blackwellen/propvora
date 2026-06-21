"use client"

import { useWorkspace } from "@/providers/AuthProvider"
import { formatPence } from "@/lib/marketplace/money"

/**
 * Returns a currency formatter that uses the workspace's i18n settings.
 * Falls back to GBP / en-GB when settings are absent.
 *
 * Usage:
 *   const fmt = useFormatCurrency()
 *   fmt(1000)  // "£10.00" for GBP, "$10.00" for USD, etc.
 */
export function useFormatCurrency(): (amountPence: number | null | undefined) => string {
  const { workspace } = useWorkspace()
  const settings =
    (workspace?.settings as Record<string, unknown> | undefined | null) ?? {}
  const currency = (settings.currency as string | undefined) ?? "GBP"

  return (amountPence: number | null | undefined) =>
    formatPence(amountPence, currency)
}
