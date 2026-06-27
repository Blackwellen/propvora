import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Move-in condition photos — customer_tenancy_condition_photos (RLS owner-scoped).
 * The image is uploaded to R2 first (POST /api/upload); this records the key.
 *
 *   POST { tenancyId, r2Key, fileName?, room? } → { item }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = (await req.json().catch(() => null)) as { tenancyId?: string; r2Key?: string; fileName?: string; room?: string } | null
  const tenancyId = body?.tenancyId?.trim()
  const r2Key = body?.r2Key?.trim()
  if (!tenancyId || !r2Key) return NextResponse.json({ error: "tenancyId and r2Key are required" }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from("customer_tenancy_condition_photos")
      .insert({
        customer_id: user.id,
        customer_tenancy_id: tenancyId,
        room: typeof body?.room === "string" ? body.room : "General",
        storage_path: r2Key,
        file_name: typeof body?.fileName === "string" ? body.fileName : null,
        status: "active",
        created_by: user.id,
      })
      .select("id, room, file_name")
      .maybeSingle()
    if (error) { const c = (error as { code?: string }).code; if (c === "42P01" || c === "PGRST205") return NextResponse.json({ error: "Not ready yet." }, { status: 503 }); throw error }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save the photo." }, { status: 500 })
  }
}
