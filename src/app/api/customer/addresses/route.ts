import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer saved addresses — `customer_saved_addresses` under RLS
 * (workspace_id NULL + customer_id = auth.uid()).
 *
 *   GET    → { items }
 *   POST   { label, line1, line2?, city, region?, postcode, country?, isDefault? } → { item }
 *   DELETE ?id=…  → { ok: true }
 */

function missingTable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "PGRST205"
}

const COLS = "id, label, line1, line2, city, region, postcode, country, is_default, created_at"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from("customer_saved_addresses")
      .select(COLS)
      .eq("customer_id", user.id)
      .neq("status", "removed")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
    if (error) {
      if (missingTable(error)) return NextResponse.json({ items: [] })
      throw error
    }
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Could not load addresses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const line1 = typeof body?.line1 === "string" ? body.line1.trim() : ""
  const city = typeof body?.city === "string" ? body.city.trim() : ""
  const postcode = typeof body?.postcode === "string" ? body.postcode.trim() : ""
  if (!line1 || !city || !postcode) {
    return NextResponse.json({ error: "line1, city and postcode are required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("customer_saved_addresses")
      .insert({
        customer_id: user.id,
        status: "active",
        label: typeof body?.label === "string" ? body.label : "Home",
        line1,
        line2: typeof body?.line2 === "string" ? body.line2 : null,
        city,
        region: typeof body?.region === "string" ? body.region : null,
        postcode,
        country: typeof body?.country === "string" ? body.country : "GB",
        is_default: body?.isDefault === true,
        created_by: user.id,
      })
      .select(COLS)
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Addresses are not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save address" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  try {
    const { error } = await supabase
      .from("customer_saved_addresses")
      .update({ status: "removed" })
      .eq("customer_id", user.id)
      .eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not remove address" }, { status: 500 })
  }
}
