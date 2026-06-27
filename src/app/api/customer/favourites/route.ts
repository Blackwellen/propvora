import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer favourites — wired to `customer_favourites` under RLS.
 *
 * The customer owns the row (workspace_id NULL + customer_id = auth.uid() passes
 * the table's RLS WITH CHECK). External references (e.g. a stay slug, which may
 * not be a UUID) are stored in metadata_json.ref alongside a human label.
 *
 *   GET    → { items: [...] }
 *   POST   { entityType, ref, label? }  → { item }   (idempotent per ref)
 *   DELETE ?id=… | ?ref=…               → { ok: true }
 */

interface FavRow {
  id: string
  entity_type: string | null
  status: string | null
  metadata_json: { ref?: string; label?: string } | null
  created_at: string
}

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}
function missingTable(e: unknown): boolean {
  return code(e) === "42P01" || code(e) === "PGRST205"
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  try {
    const { data, error } = await supabase
      .from("customer_favourites")
      .select("id, entity_type, status, metadata_json, created_at")
      .eq("customer_id", user.id)
      .neq("status", "removed")
      .order("created_at", { ascending: false })
    if (error) {
      if (missingTable(error)) return NextResponse.json({ items: [] })
      throw error
    }
    return NextResponse.json({ items: (data as FavRow[] | null) ?? [] })
  } catch {
    return NextResponse.json({ error: "Could not load favourites" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { entityType?: string; ref?: string; label?: string } | null
  const ref = body?.ref?.trim()
  const entityType = (body?.entityType ?? "stay").trim()
  if (!ref) return NextResponse.json({ error: "ref is required" }, { status: 400 })

  try {
    // Idempotent: if it already exists (incl. soft-removed), reactivate it.
    const { data: existing } = await supabase
      .from("customer_favourites")
      .select("id")
      .eq("customer_id", user.id)
      .eq("entity_type", entityType)
      .eq("metadata_json->>ref", ref)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from("customer_favourites")
        .update({ status: "active" })
        .eq("id", existing.id)
        .select("id, entity_type, status, metadata_json, created_at")
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({ item: data })
    }

    const { data, error } = await supabase
      .from("customer_favourites")
      .insert({
        customer_id: user.id,
        entity_type: entityType,
        status: "active",
        metadata_json: { ref, label: body?.label ?? null },
        created_by: user.id,
      })
      .select("id, entity_type, status, metadata_json, created_at")
      .maybeSingle()
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Favourites are not ready yet." }, { status: 503 })
      throw error
    }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save favourite" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get("id")
  const ref = url.searchParams.get("ref")
  if (!id && !ref) return NextResponse.json({ error: "id or ref is required" }, { status: 400 })

  try {
    let qb = supabase.from("customer_favourites").update({ status: "removed" }).eq("customer_id", user.id)
    qb = id ? qb.eq("id", id) : qb.eq("metadata_json->>ref", ref!)
    const { error } = await qb
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Could not remove favourite" }, { status: 500 })
  }
}
