import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer notification preferences — `customer_notification_preferences` under
 * RLS (workspace_id NULL + customer_id = auth.uid()). One row per (channel,
 * category) per customer.
 *
 *   GET → { items: [{ channel, category, enabled }] }
 *   PUT { channel, category, enabled } → { item }   (upsert by channel+category)
 */

function missingTable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "PGRST205"
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from("customer_notification_preferences")
      .select("channel, category, enabled")
      .eq("customer_id", user.id)
    if (error) {
      if (missingTable(error)) return NextResponse.json({ items: [] })
      throw error
    }
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Could not load preferences" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as
    | { channel?: string; category?: string; enabled?: boolean }
    | null
  const channel = body?.channel?.trim()
  const category = body?.category?.trim() || "all"
  if (!channel || typeof body?.enabled !== "boolean") {
    return NextResponse.json({ error: "channel and enabled are required" }, { status: 400 })
  }

  try {
    const { data: existing } = await supabase
      .from("customer_notification_preferences")
      .select("id")
      .eq("customer_id", user.id)
      .eq("channel", channel)
      .eq("category", category)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from("customer_notification_preferences")
        .update({ enabled: body.enabled, updated_by: user.id })
        .eq("id", existing.id)
        .select("channel, category, enabled")
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ item: data })
    }

    const { data, error } = await supabase
      .from("customer_notification_preferences")
      .insert({
        customer_id: user.id,
        channel,
        category,
        enabled: body.enabled,
        status: "active",
        created_by: user.id,
      })
      .select("channel, category, enabled")
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Preferences are not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save preference" }, { status: 500 })
  }
}
