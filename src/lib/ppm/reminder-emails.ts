/**
 * PPM reminder email dispatch (server-only).
 *
 * Runs from the daily cron (/api/cron/daily). The in-app notification + the
 * idempotency log are produced by the `dispatch_ppm_reminders()` SQL function
 * (also on pg_cron, so in-app reminders fire even if the app is down). This
 * step:
 *   1. calls that SQL function (idempotent — 0 new if pg_cron already ran today)
 *      so the email path never lags the in-app path, then
 *   2. sends an email for every dispatch row not yet emailed, via the central
 *      Resend utility (so the Resend key stays in the app env, never the DB),
 *      and marks the row emailed.
 *
 * Never import from client code.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email"

interface PendingRow {
  id: string
  email_to: string
  due_date: string
  offset_days: number
  plan_id: string
  ppm_plans: { name: string | null; category: string | null } | null
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://propvora.com"
  ).replace(/\/$/, "")
}

function formatDueDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z")
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

function reminderEmailHtml(opts: {
  planName: string
  category: string | null
  dueDate: string
  offsetDays: number
  planUrl: string
}): string {
  const { planName, category, dueDate, offsetDays, planUrl } = opts
  const days = `${offsetDays} day${offsetDays === 1 ? "" : "s"}`
  const cat = category ? ` (${category})` : ""
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#2563EB;padding:18px 24px;border-radius:12px 12px 0 0">
      <span style="color:#ffffff;font-weight:700;font-size:18px;letter-spacing:-0.01em">Propvora</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:#2563EB">Planned maintenance reminder</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a">${planName} is due in ${days}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569">
        The planned maintenance schedule <strong>${planName}</strong>${cat} is due on
        <strong>${formatDueDate(dueDate)}</strong>. Arrange the work and any access in good time to stay compliant.
      </p>
      <a href="${planUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px">View schedule</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#94a3b8">
        You're receiving this because you manage this PPM schedule in Propvora. Manage reminders from the schedule's page.
      </p>
    </div>
  </div>
</body></html>`
}

export interface ReminderEmailResult {
  created: number
  emailed: number
  failed: number
}

export async function dispatchPpmReminderEmails(admin: SupabaseClient): Promise<ReminderEmailResult> {
  const result: ReminderEmailResult = { created: 0, emailed: 0, failed: 0 }

  // 1. Ensure today's in-app notifications + dispatch rows exist (idempotent).
  const { data: created, error: rpcError } = await admin.rpc("dispatch_ppm_reminders")
  if (!rpcError && typeof created === "number") result.created = created

  // 2. Email every dispatch row that hasn't been emailed yet.
  const { data, error } = await admin
    .from("ppm_reminder_dispatch")
    .select("id, email_to, due_date, offset_days, plan_id, ppm_plans(name, category)")
    .eq("emailed", false)
    .not("email_to", "is", null)
    .limit(200)

  if (error) return result
  const rows = (data ?? []) as unknown as PendingRow[]
  const base = appBaseUrl()

  for (const row of rows) {
    const planName = row.ppm_plans?.name?.trim() || "PPM schedule"
    const subject = `${planName} due in ${row.offset_days} day${row.offset_days === 1 ? "" : "s"} — ${formatDueDate(row.due_date)}`
    const html = reminderEmailHtml({
      planName,
      category: row.ppm_plans?.category ?? null,
      dueDate: row.due_date,
      offsetDays: row.offset_days,
      planUrl: `${base}/property-manager/work/ppm/${row.plan_id}`,
    })

    const { error: sendError } = await sendEmail({ to: row.email_to, subject, html })
    if (sendError) {
      result.failed += 1
      continue
    }
    // Mark emailed so it is never sent twice (the dispatch row is already the
    // in-app idempotency key; this guards the email channel specifically).
    await admin
      .from("ppm_reminder_dispatch")
      .update({ emailed: true, emailed_at: new Date().toISOString() })
      .eq("id", row.id)
    result.emailed += 1
  }

  return result
}
