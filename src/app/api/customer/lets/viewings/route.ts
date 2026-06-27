import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PATCH /api/customer/lets/viewings
 * Body: { id, action: "confirm" | "reschedule" | "cancel", requestedFor? }
 *
 * Updates one of the customer's own viewings (RLS-scoped). Reschedule moves the
 * status to reschedule_requested and stores the proposed new time.
 */
const STATUS: Record<string, string> = {
  confirm: "confirmed",
  reschedule: "reschedule_requested",
  cancel: "cancelled",
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { id?: string; action?: string; requestedFor?: string } | null
  const id = body?.id?.trim()
  const action = body?.action?.trim() ?? ""
  if (!id || !STATUS[action]) return NextResponse.json({ error: "id and a valid action are required" }, { status: 400 })

  const patch: Record<string, unknown> = { viewing_status: STATUS[action], updated_by: user.id }
  if (action === "reschedule" && typeof body?.requestedFor === "string") patch.requested_for = body.requestedFor

  try {
    const { data, error } = await supabase
      .from("customer_let_viewings")
      .update(patch)
      .eq("id", id)
      .eq("customer_id", user.id)
      .select("id, viewing_status")
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: "Viewing not found." }, { status: 404 })
    return NextResponse.json({ ok: true, status: data.viewing_status })
  } catch {
    return NextResponse.json({ error: "Could not update the viewing." }, { status: 500 })
  }
}
