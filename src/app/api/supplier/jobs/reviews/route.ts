import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   GET /api/supplier/jobs/reviews?workspaceId=...

   Read-only list of verified reviews for a supplier workspace. There is no
   `supplier_reviews` table in the live schema yet, so this route is honest about
   that: it attempts the read and, if the table is absent (42P01/PGRST205),
   returns an empty list with HTTP 200 so the UI shows a calm "No reviews yet"
   state rather than an error. When a reviews table is provisioned this route can
   map its rows without any client change.

   Auth + supplier-workspace membership required.
─────────────────────────────────────────────────────────────────────────── */

const NOT_PROVISIONED = new Set(["42P01", "PGRST205"])

async function isSupplierWorkspaceMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    if (data) return true
  } catch {
    /* fall through */
  }
  try {
    const { data } = await supabase
      .from("supplier_workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const workspaceId = (new URL(request.url).searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    try {
      const { data, error } = await supabase
        .from("supplier_reviews")
        .select("*")
        .eq("supplier_workspace_id", workspaceId)
        .order("created_at", { ascending: false })
      if (error) {
        if (error.code && NOT_PROVISIONED.has(error.code)) {
          return NextResponse.json({ reviews: [] })
        }
        throw error
      }
      return NextResponse.json({ reviews: data ?? [] })
    } catch (err) {
      const code = (err as { code?: string } | null)?.code
      if (code && NOT_PROVISIONED.has(code)) return NextResponse.json({ reviews: [] })
      throw err
    }
  } catch (err) {
    captureException(err, { source: "api/supplier/jobs/reviews GET", requestId })
    return NextResponse.json({ error: "Failed to load reviews", requestId }, { status: 500 })
  }
}
