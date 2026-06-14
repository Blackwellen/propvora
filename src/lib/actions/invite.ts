"use server"

import { createClient } from "@/lib/supabase/server"
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit/log"

export interface InviteDetails {
  status: "ok" | "not_found" | "expired" | "already_accepted" | "revoked" | "error"
  workspaceName?: string
  role?: string
  email?: string
}

export interface AcceptInviteResult {
  ok: boolean
  error?: string
  requiresAuth?: boolean
  alreadyMember?: boolean
}

function isMissingTable(code: string | undefined): boolean {
  return code === "42P01"
}

/**
 * Look up an invitation by token and return display details (inviting
 * workspace + role) plus a status the UI can branch on.
 */
export async function getInviteDetails(token: string): Promise<InviteDetails> {
  if (!token) return { status: "not_found" }

  const supabase = await createClient()

  const { data: invite, error } = await supabase
    .from("workspace_invitations")
    .select("workspace_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (error) {
    if (isMissingTable(error.code)) return { status: "error" }
    return { status: "error" }
  }
  if (!invite) return { status: "not_found" }

  if (invite.status === "accepted") return { status: "already_accepted" }
  if (invite.status === "revoked") return { status: "revoked" }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { status: "expired" }
  }

  // Resolve workspace name for display.
  let workspaceName = "a workspace"
  const { data: ws } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", invite.workspace_id)
    .maybeSingle()
  if (ws?.name) workspaceName = ws.name

  return {
    status: "ok",
    workspaceName,
    role: invite.role as string,
    email: invite.email as string,
  }
}

/**
 * Accept an invitation: creates the workspace_members row, marks the invite
 * accepted, sets the user's current workspace, and writes an audit log row.
 * The caller must be authenticated.
 */
export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  if (!token) return { ok: false, error: "Invalid invitation link." }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, requiresAuth: true, error: "Please sign in to accept this invitation." }
  }

  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invitations")
    .select("id, workspace_id, email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (inviteError) {
    if (isMissingTable(inviteError.code)) {
      return { ok: false, error: "Invitations are not available right now. Please try again later." }
    }
    return { ok: false, error: "We couldn't load this invitation." }
  }
  if (!invite) return { ok: false, error: "This invitation is invalid." }
  if (invite.status === "accepted") {
    return { ok: false, alreadyMember: true, error: "This invitation has already been accepted." }
  }
  if (invite.status === "revoked") return { ok: false, error: "This invitation has been revoked." }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: "This invitation has expired. Ask the workspace owner to send a new one." }
  }

  // Create the membership (ignore duplicate — user may already be a member).
  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: invite.workspace_id,
    user_id: user.id,
    role: invite.role,
    invited_by: null,
    joined_at: new Date().toISOString(),
  })

  if (memberError && memberError.code !== "23505") {
    console.error("[acceptInvite] member insert failed:", memberError)
    return { ok: false, error: "We couldn't add you to the workspace. Please try again." }
  }

  // Mark the invitation accepted.
  await supabase
    .from("workspace_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invite.id)

  // Set this as the user's current workspace if they don't have one.
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.current_workspace_id) {
    await supabase
      .from("profiles")
      .update({ current_workspace_id: invite.workspace_id, updated_at: new Date().toISOString() })
      .eq("id", user.id)
  }

  // Best-effort audit trail.
  await recordAudit(supabase, {
    workspaceId: invite.workspace_id,
    userId: user.id,
    action: AUDIT_ACTIONS.INVITE_ACCEPTED,
    resourceType: "workspace_invitation",
    resourceId: invite.id,
  })

  return { ok: true }
}
