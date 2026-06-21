import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/documents/signed-url?id=<document_id>
 *
 * Returns a short-lived signed URL for the given document, verifying:
 * 1. The caller is authenticated.
 * 2. The document belongs to the caller's active workspace (IDOR protection).
 * 3. A signed URL is generated for the file in Supabase Storage (60 min TTL).
 *
 * Falls back gracefully if the `documents` table or storage bucket doesn't
 * exist yet (42P01-safe).
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // Resolve active workspace
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()

  const workspaceId = profile?.current_workspace_id as string | undefined
  if (!workspaceId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 403 })
  }

  // Fetch the document — workspace_id scope prevents IDOR
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("url, storage_path, workspace_id")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle()

  if (docError) {
    if (docError.code === "42P01") {
      // documents table not yet migrated — honest fallback
      return NextResponse.json({ error: "Documents table not available", url: null }, { status: 503 })
    }
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // If the document has a storage_path, generate a signed URL (60 min TTL).
  const storagePath = (doc as { storage_path?: string | null }).storage_path
  if (storagePath) {
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET ?? "documents"
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600) // 1 hour TTL

    if (!signErr && signed?.signedUrl) {
      return NextResponse.json({ url: signed.signedUrl })
    }
  }

  // Fall back to the stored URL (may be a public URL from legacy upload)
  const rawUrl = (doc as { url?: string | null }).url
  if (rawUrl) {
    return NextResponse.json({ url: rawUrl })
  }

  return NextResponse.json({ error: "No file attached to this document", url: null }, { status: 404 })
}
