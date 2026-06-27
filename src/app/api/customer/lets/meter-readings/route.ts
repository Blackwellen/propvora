import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Move-in meter readings — customer_tenancy_meter_readings (RLS owner-scoped).
 *
 *   GET   ?tenancyId=…                          → { items }
 *   POST  { tenancyId, meterType, value, readOn? } → { item }
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const tenancyId = new URL(req.url).searchParams.get("tenancyId")
  if (!tenancyId) return NextResponse.json({ items: [] })
  try {
    const { data, error } = await supabase
      .from("customer_tenancy_meter_readings")
      .select("id, meter_type, reading_value, read_on")
      .eq("customer_tenancy_id", tenancyId).eq("customer_id", user.id)
      .neq("status", "removed").order("read_on", { ascending: false })
    if (error) { const c = (error as { code?: string }).code; if (c === "42P01" || c === "PGRST205") return NextResponse.json({ items: [] }); throw error }
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { tenancyId?: string; meterType?: string; value?: number | string; readOn?: string } | null
  const tenancyId = body?.tenancyId?.trim()
  const meterType = body?.meterType?.trim()
  const value = typeof body?.value === "number" ? body.value : Number(String(body?.value ?? "").replace(/[^\d.]/g, ""))
  if (!tenancyId || !meterType || !Number.isFinite(value)) {
    return NextResponse.json({ error: "tenancyId, meterType and a numeric value are required" }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("customer_tenancy_meter_readings")
      .insert({
        customer_id: user.id,
        customer_tenancy_id: tenancyId,
        meter_type: meterType,
        reading_value: value,
        read_on: typeof body?.readOn === "string" ? body.readOn : new Date().toISOString().slice(0, 10),
        status: "active",
        created_by: user.id,
      })
      .select("id, meter_type, reading_value, read_on")
      .maybeSingle()
    if (error) { const c = (error as { code?: string }).code; if (c === "42P01" || c === "PGRST205") return NextResponse.json({ error: "Not ready yet." }, { status: 503 }); throw error }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save the reading." }, { status: 500 })
  }
}
