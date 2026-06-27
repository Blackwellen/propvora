import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/customer/lets/rent-schedule?tenancyId=…
 * The customer's rent schedule for one tenancy (RLS owner-scoped), newest first.
 */
function fmtMonth(iso: string | null): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) } catch { return "—" }
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } catch { return "—" }
}
const TONE: Record<string, string> = { paid: "emerald", pending: "amber", overdue: "red", upcoming: "blue" }

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const tenancyId = new URL(req.url).searchParams.get("tenancyId")
  if (!tenancyId) return NextResponse.json({ items: [] })

  try {
    const { data, error } = await supabase
      .from("customer_tenancy_rent_schedule")
      .select("id, due_date, amount_pence, payment_status")
      .eq("customer_tenancy_id", tenancyId)
      .eq("customer_id", user.id)
      .order("due_date", { ascending: false })
    if (error) {
      const c = (error as { code?: string }).code
      if (c === "42P01" || c === "PGRST205") return NextResponse.json({ items: [] })
      throw error
    }
    const items = (data as { id: string; due_date: string | null; amount_pence: number | null; payment_status: string | null }[] | null ?? []).map((r) => {
      const ps = (r.payment_status ?? "pending").toLowerCase()
      const overdue = ps !== "paid" && r.due_date ? new Date(r.due_date).getTime() < Date.now() : false
      const status = ps === "paid" ? "Paid" : overdue ? "Overdue" : "Upcoming"
      return {
        id: r.id, month: fmtMonth(r.due_date), due: fmtDate(r.due_date),
        amountPence: r.amount_pence ?? 0, status,
        tone: TONE[overdue ? "overdue" : ps] ?? "amber", method: "Card",
      }
    })
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
