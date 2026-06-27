import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, clientKey, RATE_LIMITS } from "@/lib/rate-limit"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  type: z.enum(["export", "deletion"]),
  password: z.string().min(1, "Password is required for this sensitive action"),
})

/**
 * POST /api/account/request — create a GDPR data-export (SAR) or account-deletion
 * request for the signed-in user.
 *
 * Re-authentication: the user must re-enter their current password. We verify it
 * server-side with a throwaway client (signInWithPassword) so a stolen/forgotten
 * session cannot trigger an irreversible erasure. One open request per type is
 * enforced by a partial unique index.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Rate limit: this is an irreversible/sensitive action gated by a password
  // re-check. Throttle per user (plus IP) to blunt password-guessing here.
  const rl = await rateLimit({
    key: `account-request:${user.id}:${clientKey(request, "ip")}`,
    ...RATE_LIMITS.accountRequest,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })
  }
  const { type, password } = parsed.data

  // Raw originating IP for the audit trail (clientKey returns a route-tagged key).
  const auditIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    null

  // ── Re-authenticate with a throwaway client (does not touch the live session)
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { error: pwErr } = await verifier.auth.signInWithPassword({ email: user.email, password })
  if (pwErr) {
    return NextResponse.json({ error: "Password is incorrect." }, { status: 403 })
  }

  // Resolve the user's current workspace (for context on the request). The
  // audit_logs INSERT policy requires a workspace the user belongs to, so fall
  // back to their first membership when no current workspace is set — otherwise
  // the export/deletion audit entry is silently rejected.
  let workspaceId: string | null = null
  try {
    const { data: profile } = await supabase
      .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
    workspaceId = (profile?.current_workspace_id as string | null) ?? null
    if (!workspaceId) {
      const { data: membership } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      workspaceId = (membership?.workspace_id as string | null) ?? null
    }
  } catch { /* non-fatal */ }

  if (type === "export") {
    const { error } = await supabase.from("data_export_requests").insert({
      user_id: user.id,
      workspace_id: workspaceId,
      status: "pending",
    })
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "You already have an export in progress." }, { status: 409 })
      }
      console.error("[account/request] export insert", error)
      return NextResponse.json({ error: "Could not create the export request." }, { status: 500 })
    }
    await recordAudit(supabase, {
      workspaceId,
      userId: user.id,
      action: AUDIT_ACTIONS.ACCOUNT_EXPORT_REQUESTED,
      resourceType: "data_export_request",
      ip: auditIp,
    })
    return NextResponse.json({ ok: true, type, email: user.email })
  }

  // type === "deletion"
  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    workspace_id: workspaceId,
    request_type: "user_account",
    requested_by: user.id,
    status: "pending",
  })
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "You already have a deletion request pending." }, { status: 409 })
    }
    console.error("[account/request] deletion insert", error)
    return NextResponse.json({ error: "Could not create the deletion request." }, { status: 500 })
  }
  await recordAudit(supabase, {
    workspaceId,
    userId: user.id,
    action: AUDIT_ACTIONS.ACCOUNT_DELETION_REQUESTED,
    resourceType: "account_deletion_request",
    ip: auditIp,
  })
  return NextResponse.json({ ok: true, type, email: user.email })
}
