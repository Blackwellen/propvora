import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer account settings — `customer_account_settings` (one row per customer)
 * under RLS (workspace_id NULL + customer_id = auth.uid()).
 *
 *   GET   → { settings }
 *   PATCH { locale?, timezone?, currency?, marketingOptIn? } → { settings }
 */

function missingTable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "PGRST205"
}

const COLS = "id, locale, timezone, currency, marketing_opt_in, status, updated_at"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from("customer_account_settings")
      .select(COLS)
      .eq("customer_id", user.id)
      .maybeSingle()
    if (error && !missingTable(error)) throw error
    return NextResponse.json({ settings: data ?? null })
  } catch {
    return NextResponse.json({ error: "Could not load settings" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as
    | { locale?: string; timezone?: string; currency?: string; marketingOptIn?: boolean }
    | null
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 })

  const patch: Record<string, unknown> = { updated_by: user.id }
  if (typeof body.locale === "string") patch.locale = body.locale
  if (typeof body.timezone === "string") patch.timezone = body.timezone
  if (typeof body.currency === "string") patch.currency = body.currency
  if (typeof body.marketingOptIn === "boolean") patch.marketing_opt_in = body.marketingOptIn

  try {
    const { data: existing } = await supabase
      .from("customer_account_settings")
      .select("id")
      .eq("customer_id", user.id)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from("customer_account_settings")
        .update(patch)
        .eq("id", existing.id)
        .select(COLS)
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ settings: data })
    }

    const { data, error } = await supabase
      .from("customer_account_settings")
      .insert({ customer_id: user.id, status: "active", created_by: user.id, ...patch })
      .select(COLS)
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Settings are not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ settings: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 })
  }
}
