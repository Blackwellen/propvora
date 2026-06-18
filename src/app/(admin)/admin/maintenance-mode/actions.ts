"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"
import type { MaintenanceConfig } from "@/lib/admin/pages/batch4"

export interface ActionResult {
  ok: boolean
  error?: string
}

const MODES = ["full", "restricted", "degraded"] as const

/** Persist the maintenance-mode config to platform_settings + audit. */
export async function saveMaintenance(input: MaintenanceConfig & { intent: "enable" | "draft" | "schedule" }): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const mode = MODES.includes(input.mode) ? input.mode : "full"
    const enabled = input.intent === "enable" ? true : input.intent === "draft" ? false : input.enabled

    const value = {
      enabled,
      mode,
      message: (input.message ?? "").slice(0, 2000),
      allowlist: Array.isArray(input.allowlist) ? input.allowlist.filter(Boolean).slice(0, 200) : [],
      allow_admins: input.allowAdmins !== false,
      scheduled_for: input.intent === "schedule" ? input.scheduledFor ?? null : null,
    }

    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { key: "maintenance", value, updated_by: identity.userId, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "platform_settings table not provisioned yet." }
      return { ok: false, error: error.message }
    }

    await writeAudit({
      actorId: identity.userId,
      action: input.intent === "enable" ? "maintenance_mode.enabled" : input.intent === "schedule" ? "maintenance_mode.scheduled" : "maintenance_mode.saved",
      resourceType: "platform_settings",
      after: value,
    })
    revalidatePath("/admin/maintenance-mode")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
