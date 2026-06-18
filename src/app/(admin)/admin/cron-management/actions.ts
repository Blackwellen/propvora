"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/admin/guard"
import { writeAudit } from "@/lib/admin/audit"

export interface CronActionResult {
  ok: boolean
  error?: string
}

const ALLOWED = new Set(["run", "pause", "resume"])

/**
 * Record an authorised cron control request (manual run / pause / resume).
 *
 * This is a DANGEROUS, EXPLICIT admin action:
 *   1. Re-verifies platform-admin identity server-side (requireAdmin — fail-closed).
 *   2. Writes an audit_logs entry (writeAudit — append-only, never throws).
 *   3. Revalidates the cron page.
 *
 * There is no standalone cron-registry table in the live schema, so this records
 * the authorised operator request to the audit trail (real, recorded) rather than
 * fabricating job state. The actual execution is performed by the scheduled-job
 * runner; this is the governance + audit surface for it.
 */
export async function recordCronAction(input: {
  action: "run" | "pause" | "resume"
  jobKey: string
}): Promise<CronActionResult> {
  try {
    const identity = await requireAdmin()
    if (!ALLOWED.has(input.action)) return { ok: false, error: "Invalid action." }
    const jobKey = (input.jobKey || "").trim()
    if (!jobKey) return { ok: false, error: "A job is required." }

    await writeAudit({
      actorId: identity.userId,
      action: `cron.${input.action}_requested`,
      resourceType: "cron_job",
      resourceId: jobKey,
      after: { job: jobKey, requested_action: input.action },
    })

    revalidatePath("/admin/cron-management")
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Action failed" }
  }
}
