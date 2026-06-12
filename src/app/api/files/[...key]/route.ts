import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getObjectBytes, r2Configured } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/files/{workspaceId}/{folder}/{file}
 * Streams a private R2 object after verifying the caller is a member of the
 * workspace that owns the key (keys are prefixed with the workspace id).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (!r2Configured()) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 })
  }

  const { key: segments } = await params
  const key = (segments ?? []).join("/")
  const workspaceId = segments?.[0]
  if (!key || !workspaceId) {
    return NextResponse.json({ error: "Invalid file key" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle()
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const obj = await getObjectBytes(key)
  if (!obj) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  return new NextResponse(Buffer.from(obj.body), {
    status: 200,
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
    },
  })
}
