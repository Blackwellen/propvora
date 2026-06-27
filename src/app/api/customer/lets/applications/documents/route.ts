import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Customer let-application documents — customer_let_application_documents (RLS
 * owner-scoped). The file is uploaded to R2 first (POST /api/upload); this records
 * the resulting key against the application.
 *
 *   GET    ?applicationId=…  → { items }
 *   POST   { applicationId, docType?, r2Key, fileName?, contentType? } → { item }
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const applicationId = new URL(req.url).searchParams.get("applicationId")
  if (!applicationId) return NextResponse.json({ items: [] })
  try {
    const { data, error } = await supabase
      .from("customer_let_application_documents")
      .select("id, doc_type, file_name, content_type, created_at")
      .eq("application_id", applicationId).eq("customer_id", user.id)
      .neq("status", "removed").order("created_at", { ascending: false })
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

  const body = (await req.json().catch(() => null)) as
    | { applicationId?: string; docType?: string; r2Key?: string; fileName?: string; contentType?: string }
    | null
  const applicationId = body?.applicationId?.trim()
  const r2Key = body?.r2Key?.trim()
  if (!applicationId || !r2Key) return NextResponse.json({ error: "applicationId and r2Key are required" }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from("customer_let_application_documents")
      .insert({
        customer_id: user.id,
        application_id: applicationId,
        doc_type: typeof body?.docType === "string" ? body.docType : "other",
        storage_path: r2Key,
        file_name: typeof body?.fileName === "string" ? body.fileName : null,
        content_type: typeof body?.contentType === "string" ? body.contentType : null,
        status: "uploaded",
        created_by: user.id,
      })
      .select("id, doc_type, file_name")
      .maybeSingle()
    if (error) { const c = (error as { code?: string }).code; if (c === "42P01" || c === "PGRST205") return NextResponse.json({ error: "Not ready yet." }, { status: 503 }); throw error }
    return NextResponse.json({ item: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Could not save the document." }, { status: 500 })
  }
}
