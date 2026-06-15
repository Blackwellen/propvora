"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"

export interface ActionResult {
  ok: boolean
  error?: string
}

/** Enable/disable a provider. */
export async function setProviderEnabled(providerId: string, enabled: boolean): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_providers")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", providerId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: enabled ? "ai_provider.enabled" : "ai_provider.disabled",
      resourceType: "ai_provider",
      resourceId: providerId,
      after: { enabled },
    })
    revalidatePath("/admin/ai-models")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

/** Enable/disable a model. */
export async function setModelEnabled(modelId: string, enabled: boolean): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()
    const { error } = await admin
      .from("ai_models")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", modelId)
    if (error) return { ok: false, error: error.message }
    await writeAudit({
      actorId: identity.userId,
      action: enabled ? "ai_model.enabled" : "ai_model.disabled",
      resourceType: "ai_model",
      resourceId: modelId,
      after: { enabled },
    })
    revalidatePath("/admin/ai-models")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" }
  }
}

/**
 * Set a model as THE default. Clears the flag on every other model first
 * (a partial unique index enforces at-most-one default), then enables + flags
 * the chosen one. A disabled model cannot be the default, so we enable it too.
 */
export async function setDefaultModel(modelId: string): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    const admin = createAdminClient()

    // Clear existing default(s).
    const { error: clearErr } = await admin
      .from("ai_models")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("is_default", true)
    if (clearErr) return { ok: false, error: clearErr.message }

    const { error } = await admin
      .from("ai_models")
      .update({ is_default: true, enabled: true, updated_at: new Date().toISOString() })
      .eq("id", modelId)
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action: "ai_model.set_default",
      resourceType: "ai_model",
      resourceId: modelId,
      after: { is_default: true },
    })
    revalidatePath("/admin/ai-models")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" }
  }
}
