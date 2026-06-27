import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  listCustomerSavedSearches,
  createCustomerSavedSearch,
  deleteCustomerSavedSearch,
} from "@/lib/customer/data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer saved searches — `customer_saved_searches` (RLS anchored on
 * customer_workspace_id). Uses the canonical helpers in lib/customer/data.
 *
 *   GET    → { items }
 *   POST   { label, query }  → { ok }
 *   DELETE ?id=…             → { ok }
 */

async function resolveCustomerWorkspace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
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

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const workspaceId = await resolveCustomerWorkspace(supabase, user.id)
  if (!workspaceId) return NextResponse.json({ items: [] })
  try {
    const items = await listCustomerSavedSearches(supabase, workspaceId)
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const workspaceId = await resolveCustomerWorkspace(supabase, user.id)
  if (!workspaceId) return NextResponse.json({ error: "Not a customer" }, { status: 403 })

  const body = (await req.json().catch(() => null)) as { label?: string; query?: Record<string, unknown> } | null
  const label = body?.label?.trim()
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 })

  try {
    const ok = await createCustomerSavedSearch(supabase, workspaceId, label, body?.query ?? {})
    if (!ok) return NextResponse.json({ error: "Could not save the search." }, { status: 503 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save the search." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const workspaceId = await resolveCustomerWorkspace(supabase, user.id)
  if (!workspaceId) return NextResponse.json({ error: "Not a customer" }, { status: 403 })
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  try {
    const ok = await deleteCustomerSavedSearch(supabase, workspaceId, id)
    return NextResponse.json({ ok })
  } catch {
    return NextResponse.json({ error: "Could not delete the search." }, { status: 500 })
  }
}
