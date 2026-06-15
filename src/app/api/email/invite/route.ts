import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/email"
import { workspaceInviteEmail } from "@/lib/emails/workspace-invite"
import { rateLimit, clientKey, RATE_LIMITS } from "@/lib/rate-limit"
import { createAdminClient } from "@/lib/supabase/admin"

/** Roles permitted to invite teammates. */
const INVITER_ROLES = new Set(["owner", "admin"])

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // setAll called from a Server Component — safe to ignore
            }
          },
        },
      }
    )

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit invite sends per inviter (plus IP) to curb invite-spam / email
    // abuse from a compromised or malicious account.
    const rl = await rateLimit({
      key: `invite:${user.id}:${clientKey(request, "ip")}`,
      ...RATE_LIMITS.invite,
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      )
    }

    const body = await request.json() as {
      inviteeEmail?: unknown
      inviteeName?: unknown
      workspaceName?: unknown
      invitationId?: unknown
    }

    const { inviteeEmail, inviteeName, workspaceName, invitationId } = body

    if (
      typeof inviteeEmail !== "string" ||
      typeof workspaceName !== "string" ||
      typeof invitationId !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required fields: inviteeEmail, workspaceName, invitationId" },
        { status: 400 }
      )
    }

    // ── Authorisation: the caller must be an OWNER/ADMIN of the workspace that
    // the invitation belongs to — not merely authenticated. We resolve the
    // invitation's workspace via the service-role client (authoritative, RLS
    // bypass), then verify the caller's role IN THAT workspace. This stops a
    // logged-in user from triggering invite emails for a workspace they don't
    // administer (or don't belong to at all). Fail-closed on any uncertainty.
    const admin = createAdminClient()
    const { data: invitation, error: invErr } = await admin
      .from("workspace_invitations")
      .select("workspace_id, email")
      .eq("id", invitationId)
      .maybeSingle()

    if (invErr || !invitation?.workspace_id) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    const { data: membership, error: memErr } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", invitation.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle()

    const callerRole = (membership?.role as string | undefined)?.toLowerCase()
    if (memErr || !callerRole || !INVITER_ROLES.has(callerRole)) {
      return NextResponse.json(
        { error: "You must be an owner or admin of this workspace to send invites." },
        { status: 403 }
      )
    }

    // Bind the email we send to the invitation's recorded address — don't let
    // the caller redirect the invite to an arbitrary recipient.
    const recordedEmail = (invitation.email as string | null)?.trim().toLowerCase()
    const targetEmail = recordedEmail || inviteeEmail.trim().toLowerCase()

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (request.headers.get("origin") || "https://app.propvora.com")

    const inviteUrl = `${baseUrl}/register?invite=${encodeURIComponent(invitationId)}`

    const { subject, html } = workspaceInviteEmail({
      inviteeName: typeof inviteeName === "string" ? inviteeName : inviteeEmail,
      workspaceName,
      inviteUrl,
    })

    const result = await sendEmail({ to: targetEmail, subject, html })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: result.id ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    console.error("[api/email/invite] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
