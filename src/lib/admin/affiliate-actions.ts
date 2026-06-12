"use server"

import { requireAdmin } from "@/lib/admin/guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export interface AdminActionResult {
  ok: boolean
  error?: string
}

async function audit(action: string, resourceId: string, meta: Record<string, unknown>) {
  try {
    const admin = createAdminClient()
    await admin.from("audit_logs").insert({
      workspace_id: null,
      action,
      resource_type: "affiliate_application",
      resource_id: resourceId,
      new_data: meta,
    })
  } catch {
    /* non-fatal */
  }
}

/** Approve an external affiliate application. Marks approved + records reviewer. */
export async function approveAffiliateApplication(id: string): Promise<AdminActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing application id." }
  try {
    const db = createAdminClient()
    const { error } = await db
      .from("affiliate_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: admin.userId, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { ok: false, error: "Could not approve application." }
    await audit("affiliate_application.approved", id, { by: admin.userId })
    revalidatePath("/admin/affiliates")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not approve application." }
  }
}

export async function rejectAffiliateApplication(id: string, note?: string): Promise<AdminActionResult> {
  const admin = await requireAdmin()
  if (!id) return { ok: false, error: "Missing application id." }
  try {
    const db = createAdminClient()
    const { error } = await db
      .from("affiliate_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: admin.userId, notes: note ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { ok: false, error: "Could not reject application." }
    await audit("affiliate_application.rejected", id, { by: admin.userId, note: note ?? null })
    revalidatePath("/admin/affiliates")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not reject application." }
  }
}

/** Suspend / reactivate an enrolled affiliate (by workspace id). */
export async function setAffiliateSuspended(workspaceId: string, suspended: boolean): Promise<AdminActionResult> {
  const admin = await requireAdmin()
  if (!workspaceId) return { ok: false, error: "Missing workspace id." }
  try {
    const db = createAdminClient()
    // `approved=false` acts as a suspension gate (commission accrual checks approved).
    const { error } = await db
      .from("affiliates")
      .update({ approved: !suspended, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId)
    if (error) return { ok: false, error: "Could not update affiliate." }
    try {
      await db.from("audit_logs").insert({
        workspace_id: workspaceId,
        action: suspended ? "affiliate.suspended" : "affiliate.reactivated",
        resource_type: "affiliate",
        resource_id: workspaceId,
        new_data: { by: admin.userId },
      })
    } catch { /* non-fatal */ }
    revalidatePath("/admin/affiliates")
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not update affiliate." }
  }
}
