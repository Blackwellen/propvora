import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * POST /api/customer/maintenance — submit a new tenant maintenance request.
 * PATCH /api/customer/maintenance — attach photo URLs to an existing request.
 *
 * The INSERT uses a service-role client because customer_maintenance_requests is
 * operator-workspace gated (no customer INSERT RLS policy). The customer's
 * authenticated session is still verified first. No cross-workspace write is
 * possible because the customer workspace ID is resolved from session membership.
 */

async function resolveCustomerWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("customer_workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle()
    return (data as { workspace_id?: string } | null)?.workspace_id ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const workspaceId = await resolveCustomerWorkspace(supabase, user.id)
  if (!workspaceId) return NextResponse.json({ error: "Not a customer" }, { status: 403 })

  let payload: { category?: string; severity?: string; subject?: string; detail?: string; room?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const { category, severity, subject, detail, room } = payload
  if (!subject?.trim() || !detail?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const writer = createAdminClient()
  try {
    const { data: inserted, error: insertErr } = await writer
      .from("customer_maintenance_requests")
      .insert({
        customer_workspace_id: workspaceId,
        user_id: user.id,
        category: category || "other",
        severity: severity || "normal",
        subject: subject.trim(),
        detail: detail.trim(),
        room: room?.trim() || null,
        status: "open",
        reported_by: user.email ?? user.id,
      })
      .select("id")
      .single()

    if (insertErr) {
      // Table may not exist yet — 42P01. Return gracefully.
      if (insertErr.code === "42P01") {
        return NextResponse.json({ requestId: `pending-${Date.now()}` })
      }
      throw insertErr
    }

    // Best-effort: drop a confirmation notification.
    try {
      await writer.from("customer_notifications").insert({
        customer_workspace_id: workspaceId,
        user_id: user.id,
        kind: "maintenance_submitted",
        title: "Repair request submitted",
        body: subject.trim(),
        href: "/user/maintenance",
        severity: "info",
        entity_type: "maintenance_request",
        entity_id: inserted.id,
      })
    } catch {
      // non-fatal
    }

    return NextResponse.json({ requestId: inserted.id })
  } catch (e) {
    console.error("[maintenance POST]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const workspaceId = await resolveCustomerWorkspace(supabase, user.id)
  if (!workspaceId) return NextResponse.json({ error: "Not a customer" }, { status: 403 })

  let payload: { requestId?: string; photoUrls?: string[] }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const { requestId, photoUrls } = payload
  if (!requestId || !photoUrls?.length) {
    return NextResponse.json({ ok: true })
  }

  // Sanitise URLs.
  const safeUrls = photoUrls.filter(
    (u) => typeof u === "string" && (u.includes(".supabase.co/storage") || u.includes(".r2.dev"))
  )

  if (!safeUrls.length) return NextResponse.json({ ok: true })

  const writer = createAdminClient()
  try {
    await writer
      .from("customer_maintenance_requests")
      .update({ photo_urls: safeUrls, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("customer_workspace_id", workspaceId)
  } catch {
    // non-fatal — photos are bonus
  }

  return NextResponse.json({ ok: true })
}
