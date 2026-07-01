// ============================================================================
// Automated affiliate application acceptance (system / cron).
//
// Auto-approves every new affiliate application and emails the applicant a
// confirmation with the login link + their referral code. Runs on the affiliate
// cron (and the daily aggregator).
//
// IDEMPOTENT + email-reliable:
//   * Approves applications in 'submitted' / 'pending_review' (stamps
//     metadata.auto_accepted_at), leaving admin-set states (needs_more_info,
//     waitlisted, rejected, draft) untouched.
//   * Sends the welcome email, then stamps metadata.welcome_emailed_at so it is
//     never sent twice.
//   * A retry pass re-picks already-approved-but-not-emailed rows, so a transient
//     email failure self-heals on the next run — every accepted applicant is
//     guaranteed to get exactly one confirmation.
//   * Service-role only; never runs on the client.
// ============================================================================

import type { createAdminClient } from "@/lib/supabase/admin"
import { sendEmail } from "@/lib/email"
import { affiliateApprovedEmail } from "@/lib/emails/affiliate-approved"

type DB = ReturnType<typeof createAdminClient>

const LOGIN_URL = "https://www.propvora.com/affiliate-login"
const REPLY_TO = "partners@propvora.com"
const BATCH = 200

export interface AutoAcceptSummary {
  ran: boolean
  approved: number
  emailed: number
  emailFailed: number
}

interface AppRow {
  id: string
  full_name: string | null
  email: string | null
  referral_code: string | null
  status: string
  metadata: Record<string, unknown> | null
}

async function audit(db: DB, id: string, meta: Record<string, unknown>) {
  try {
    await db.from("audit_logs").insert({
      workspace_id: null,
      user_id: null,
      action: "affiliate_application.auto_approved",
      resource_type: "affiliate_application",
      resource_id: id,
      new_data: meta,
    })
  } catch {
    /* non-fatal */
  }
}

async function processOne(db: DB, app: AppRow, summary: AutoAcceptSummary): Promise<void> {
  const nowIso = new Date().toISOString()
  let metadata: Record<string, unknown> = { ...(app.metadata ?? {}) }

  // 1. Approve if still pending (guarded on the pending statuses so we never
  //    override an admin decision made between the fetch and the update).
  if (app.status !== "approved") {
    if (!metadata.auto_accepted_at) metadata = { ...metadata, auto_accepted_at: nowIso }
    const { data: updated } = await db
      .from("affiliate_applications")
      .update({ status: "approved", reviewed_at: nowIso, updated_at: nowIso, metadata })
      .eq("id", app.id)
      .in("status", ["submitted", "pending_review"])
      .select("id")
      .maybeSingle()
    if (updated) {
      summary.approved++
      await audit(db, app.id, { auto: true })
    } else {
      // Someone/something changed the status first — skip.
      return
    }
  }

  // 2. Send the welcome email once.
  if (!metadata.welcome_emailed_at) {
    const to = (app.email ?? "").trim()
    if (!to) return
    const { subject, html } = affiliateApprovedEmail({
      fullName: app.full_name,
      referralCode: app.referral_code,
      loginUrl: LOGIN_URL,
    })
    const res = await sendEmail({ to, subject, html, replyTo: REPLY_TO })
    if (!res.error) {
      metadata = { ...metadata, welcome_emailed_at: nowIso }
      await db.from("affiliate_applications").update({ metadata, updated_at: nowIso }).eq("id", app.id)
      summary.emailed++
    } else {
      summary.emailFailed++
    }
  }
}

export async function runAffiliateAutoAccept(db: DB): Promise<AutoAcceptSummary> {
  const summary: AutoAcceptSummary = { ran: true, approved: 0, emailed: 0, emailFailed: 0 }

  // New applications awaiting a decision → approve + email.
  let pending: AppRow[] = []
  try {
    const { data } = await db
      .from("affiliate_applications")
      .select("id, full_name, email, referral_code, status, metadata")
      .in("status", ["submitted", "pending_review"])
      .order("created_at", { ascending: true })
      .limit(BATCH)
    pending = (data as AppRow[]) ?? []
  } catch {
    return { ...summary, ran: false }
  }

  // Retry: auto-approved earlier but the confirmation email hasn't sent yet.
  let retry: AppRow[] = []
  try {
    const { data } = await db
      .from("affiliate_applications")
      .select("id, full_name, email, referral_code, status, metadata")
      .eq("status", "approved")
      .not("metadata->>auto_accepted_at", "is", null)
      .is("metadata->>welcome_emailed_at", null)
      .limit(BATCH)
    retry = (data as AppRow[]) ?? []
  } catch {
    /* non-fatal — retry pass is best-effort */
  }

  const seen = new Set<string>()
  for (const app of [...pending, ...retry]) {
    if (seen.has(app.id)) continue
    seen.add(app.id)
    try {
      await processOne(db, app, summary)
    } catch {
      /* per-row failure is non-fatal — next run retries */
    }
  }

  return summary
}
