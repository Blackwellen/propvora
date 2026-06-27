import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer favourite collections — `customer_favourite_collections` under RLS
 * (workspace_id NULL + customer_id = auth.uid()).
 *
 *   GET   → { items }
 *   POST  { name, description? } → { item }
 */

function missingTable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "PGRST205"
}

const COLS = "id, name, description, status, created_at"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  try {
    const { data, error } = await supabase
      .from("customer_favourite_collections")
      .select(COLS)
      .eq("customer_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: false })
    if (error) {
      if (missingTable(error)) return NextResponse.json({ items: [] })
      throw error
    }
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Could not load collections" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { name?: string; description?: string } | null
  const name = body?.name?.trim()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from("customer_favourite_collections")
      .insert({
        customer_id: user.id,
        name,
        description: typeof body?.description === "string" ? body.description : null,
        status: "active",
        created_by: user.id,
      })
      .select(COLS)
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Collections are not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not create collection" }, { status: 500 })
  }
}
