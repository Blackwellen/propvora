"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"
import type { AnnouncementBarConfig } from "@/lib/admin/pages/batch4"

export interface ActionResult {
  ok: boolean
  error?: string
}

const SEVERITIES = ["info", "success", "warning", "critical"] as const
const AUDIENCES = ["all", "operators", "suppliers", "customers", "workspace"] as const

export async function saveAnnouncementBar(input: AnnouncementBarConfig): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const value = {
      enabled: !!input.enabled,
      message: (input.message ?? "").slice(0, 280),
      severity: SEVERITIES.includes(input.severity) ? input.severity : "info",
      cta_label: (input.ctaLabel ?? "").slice(0, 60),
      cta_href: (input.ctaHref ?? "").slice(0, 500),
      dismissible: input.dismissible !== false,
      audience: AUDIENCES.includes(input.audience) ? input.audience : "all",
      workspace_id: input.audience === "workspace" ? input.workspaceId ?? null : null,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    }
    const { error } = await admin
      .from("platform_settings")
      .upsert(
        { key: "announcement_bar", value, updated_by: identity.userId, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      )
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205")
        return { ok: false, error: "platform_settings table not provisioned yet." }
      return { ok: false, error: error.message }
    }
    await writeAudit({
      actorId: identity.userId,
      action: input.enabled ? "announcement_bar.published" : "announcement_bar.saved",
      resourceType: "platform_settings",
      after: value,
    })
    revalidatePath("/admin/announcement-bar")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
