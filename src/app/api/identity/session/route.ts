import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import {
  resolveWorkspaceId,
  isMember,
  loadIdentityFn,
  type SupabaseServer,
} from "../_shared"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/* ──────────────────────────────────────────────────────────────────────────
   POST /api/identity/session

   Start (or resume) an identity verification for the caller's workspace. The
   VerificationSession is minted by the sibling data layer
   (`@/lib/identity/verification.startVerification`), which owns the Stripe
   Identity client + the persisted verification row. We:

     1. authenticate the user,
     2. resolve + membership-check the target workspace,
     3. dynamically import the identity lib (tolerating its absence → 503),
     4. call startVerification, which is IDEMPOTENT — it reuses an open pending
        verification rather than creating a duplicate session,
     5. return { clientSecret | url, verificationId, status }.

   ⚠️ This route makes the ONLY server-side Stripe Identity call, and only at
   request time. Nothing here runs during `tsc --noEmit`.
─────────────────────────────────────────────────────────────────────────── */

type StartVerification = (
  supabase: SupabaseServer,
  args: { workspaceId: string; userId: string; returnUrl?: string }
) => Promise<{
  verificationId?: string
  id?: string
  clientSecret?: string | null
  url?: string | null
  status?: string
}>

export async function POST(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const body = (await request.json().catch(() => ({}))) as { workspaceId?: string } | null
    const workspaceId = await resolveWorkspaceId(supabase, user.id, body?.workspaceId)
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found for this user" }, { status: 404 })
    }
    if (!(await isMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    const startVerification = await loadIdentityFn<StartVerification>(
      "verification",
      "startVerification"
    )
    if (!startVerification) {
      return NextResponse.json(
        { error: "Identity verification is not provisioned yet.", notReady: true },
        { status: 503 }
      )
    }

    const origin = new URL(request.url).origin
    const returnUrl = `${origin}/app/verification?check=complete`

    let result
    try {
      result = await startVerification(supabase, {
        workspaceId,
        userId: user.id,
        returnUrl,
      })
    } catch (err) {
      captureException(err, { source: "api/identity/session start", requestId })
      return NextResponse.json(
        { error: "Could not start verification.", requestId },
        { status: 502 }
      )
    }

    return NextResponse.json({
      verificationId: result?.verificationId ?? result?.id ?? null,
      clientSecret: result?.clientSecret ?? null,
      url: result?.url ?? null,
      status: result?.status ?? "processing",
    })
  } catch (err) {
    captureException(err, { source: "api/identity/session", requestId })
    return NextResponse.json({ error: "Failed to start verification", requestId }, { status: 500 })
  }
}
