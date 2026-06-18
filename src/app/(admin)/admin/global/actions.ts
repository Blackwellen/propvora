"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"
import type { GlobalSettings } from "@/lib/admin/pages/batch4"

export interface ActionResult {
  ok: boolean
  error?: string
}

/** Persist editable global defaults to platform_settings (key: global_defaults). */
export async function saveGlobalSettings(input: GlobalSettings): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    // Only persist editable fields — integration presence flags are derived, never stored.
    const value = {
      default_timezone: input.defaultTimezone,
      default_locale: input.defaultLocale,
      default_currency: input.defaultCurrency,
      week_start: input.weekStart,
      product_name: input.productName,
      support_email: input.supportEmail,
      support_url: input.supportUrl,
      system_from_email: input.systemFromEmail,
      digest_enabled: !!input.digestEnabled,
      enforce_mfa_admins: !!input.enforceMfaAdmins,
      session_timeout_mins: Number(input.sessionTimeoutMins) || 120,
      data_region: input.dataRegion,
      retention_days: Number(input.retentionDays) || 365,
    }
    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { key: "global_defaults", value, updated_by: identity.userId, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "platform_settings table not provisioned yet." }
      return { ok: false, error: error.message }
    }
    await writeAudit({
      actorId: identity.userId,
      action: "global_settings.saved",
      resourceType: "platform_settings",
      after: value,
    })
    revalidatePath("/admin/global")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
