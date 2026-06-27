import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * PATCH /api/customer/lets/offers
 * Body: { id, action: "accept" | "withdraw" | "amend", amountPence? }
 *
 * Updates one of the customer's own offers (RLS-scoped). Amend updates the offered
 * amount (and re-opens the offer); accept/withdraw set the status.
 */
const STATUS: Record<string, string> = {
  accept: "accepted",
  withdraw: "withdrawn",
  amend: "submitted",
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { id?: string; action?: string; amountPence?: number } | null
  const id = body?.id?.trim()
  const action = body?.action?.trim() ?? ""
  if (!id || !STATUS[action]) return NextResponse.json({ error: "id and a valid action are required" }, { status: 400 })

  const patch: Record<string, unknown> = { offer_status: STATUS[action], updated_by: user.id }
  if (action === "amend") {
    if (typeof body?.amountPence !== "number" || body.amountPence <= 0) {
      return NextResponse.json({ error: "A valid amountPence is required to amend." }, { status: 400 })
    }
    patch.offer_amount_pence = Math.round(body.amountPence)
  }

  try {
    const { data, error } = await supabase
      .from("customer_let_offers")
      .update(patch)
      .eq("id", id)
      .eq("customer_id", user.id)
      .select("id, offer_status, offer_amount_pence")
      .maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: "Offer not found." }, { status: 404 })
    return NextResponse.json({ ok: true, status: data.offer_status, amountPence: data.offer_amount_pence })
  } catch {
    return NextResponse.json({ error: "Could not update the offer." }, { status: 500 })
  }
}
