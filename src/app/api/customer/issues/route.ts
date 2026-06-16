import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createCustomerBookingIssue } from "@/lib/customer"

export const dynamic = "force-dynamic"

/**
 * Guest issue-report endpoint. The guest's authenticated client proves they are
 * (a) signed in and (b) a member of a customer workspace that can read the
 * booking. The actual INSERT into booking_issues (operator-workspace gated, no
 * guest INSERT policy) is performed with a service-role client — the only way to
 * write without widening the operator RLS. The guest never supplies a workspace
 * id, so no cross-workspace write is possible.
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  // Resolve the caller's customer workspace (membership gate).
  let workspaceId: string | null = null
  try {
    const { data } = await supabase
      .from("customer_workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()
    workspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch {
    workspaceId = null
  }
  if (!workspaceId) return NextResponse.json({ error: "Not a customer" }, { status: 403 })

  let payload: { bookingId?: string; category?: string; severity?: string; subject?: string; detail?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const { bookingId, category, severity, subject, detail } = payload
  if (!bookingId || !subject?.trim() || !detail?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const writer = createAdminClient()
  try {
    const ok = await createCustomerBookingIssue(supabase, writer, workspaceId, user.email ?? null, {
      bookingId,
      category: category || "general",
      severity: severity || "normal",
      subject: subject.trim(),
      detail: detail.trim(),
      reportedBy: user.email ?? "guest",
    })
    if (!ok) return NextResponse.json({ error: "Could not report issue" }, { status: 400 })

    // Best-effort: drop a confirmation notification for the guest.
    try {
      await writer.from("customer_notifications").insert({
        customer_workspace_id: workspaceId,
        user_id: user.id,
        kind: "issue_reported",
        title: "Issue reported",
        body: subject.trim(),
        href: `/user/bookings/${bookingId}`,
        severity: "info",
        entity_type: "booking",
        entity_id: bookingId,
      })
    } catch {
      // non-fatal
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
