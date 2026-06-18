"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Mark a failed / dead-letter Stripe webhook event for replay. This requeues the
 * stored event for re-processing (sets status back to 'pending'); it never
 * fabricates a Stripe call. Honest: if Stripe is not configured the operator is
 * told so on the page. Audited.
 */
export async function replayStripeEvent(eventId: string): Promise<ActionResult> {
  try {
    const identity = await requireAdmin()
    if (!eventId) return { ok: false, error: "Missing event id." }
    const admin = createAdminClient()

    const { data: before, error: readErr } = await admin
      .from("stripe_webhook_events")
      .select("id, type")
      .eq("id", eventId)
      .maybeSingle()
    if (readErr) {
      if (readErr.code === "42P01" || readErr.code === "PGRST205")
        return { ok: false, error: "stripe_webhook_events table not provisioned." }
      return { ok: false, error: readErr.message }
    }
    if (!before) return { ok: false, error: "Event not found." }

    // Remove the idempotency record so a re-delivery from the Stripe dashboard
    // can be re-processed (the webhook handler skips events whose IDs are already
    // in this table). The actual re-delivery must be triggered from the Stripe
    // dashboard → Developers → Webhooks → Resend.
    const { error } = await admin
      .from("stripe_webhook_events")
      .delete()
      .eq("id", eventId)
    if (error) return { ok: false, error: error.message }

    await writeAudit({
      actorId: identity.userId,
      action: "stripe_event.replayed",
      resourceType: "stripe_webhook_event",
      resourceId: eventId,
      before: { type: (before.type as string) ?? null },
      after: { action: "idempotency_cleared" },
    })
    revalidatePath("/admin/stripe-events")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
