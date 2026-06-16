import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  listPrivacyRequests,
  createPrivacyRequest,
  updatePrivacyRequestStatus,
} from "@/lib/privacy/dsar"
import { resolvePrivacyContext } from "@/lib/context/privacy-context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Workspace DSAR (privacy request) engine.
 *   GET   ?workspaceId= → list
 *   POST  → create (due date computed from the workspace's privacy regime)
 *   PATCH → update status
 * RLS-scoped via workspace membership.
 */

async function memberOf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string
) {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle()
  return !!data
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workspaceId = request.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 })
  if (!(await memberOf(supabase, workspaceId, user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const requests = await listPrivacyRequests(supabase, workspaceId)
  return NextResponse.json({ requests })
}

const createSchema = z.object({
  workspaceId: z.string().min(1),
  requestType: z.enum(["access", "erasure", "rectification", "portability", "objection", "restriction"]),
  subjectName: z.string().trim().max(200).optional(),
  subjectEmail: z.string().trim().email().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  const { workspaceId } = parsed.data
  if (!(await memberOf(supabase, workspaceId, user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Resolve the workspace's privacy regime for the response clock.
  let code = "GB"
  try {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("business_country_code")
      .eq("id", workspaceId)
      .maybeSingle()
    if (ws?.business_country_code) code = String(ws.business_country_code).toUpperCase()
  } catch {
    /* default GB */
  }
  const privacy = await resolvePrivacyContext(supabase, code)

  const result = await createPrivacyRequest(supabase, {
    workspaceId,
    countryCode: code,
    regime: privacy.regime,
    dsarResponseDays: privacy.dsarResponseDays,
    requestType: parsed.data.requestType,
    subjectName: parsed.data.subjectName,
    subjectEmail: parsed.data.subjectEmail,
    notes: parsed.data.notes,
  })
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Failed" }, { status: 500 })
  return NextResponse.json({ ok: true, id: result.id })
}

const patchSchema = z.object({
  workspaceId: z.string().min(1),
  id: z.string().min(1),
  status: z.enum(["received", "identity_check", "in_progress", "extended", "fulfilled", "refused", "withdrawn"]),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  if (!(await memberOf(supabase, parsed.data.workspaceId, user.id)))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const result = await updatePrivacyRequestStatus(supabase, parsed.data.id, parsed.data.status)
  if (!result.ok) return NextResponse.json({ error: result.error ?? "Failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
