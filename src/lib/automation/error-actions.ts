"use server"

// Resolve an automation error. Marks the automation_errors row resolved and
// stamps the resolver + timestamp. Workspace scoping is enforced by RLS
// (automation_errors_ws). Returns a small result the client can act on.
import { createClient } from "@/lib/supabase/server"
import { recordAudit } from "@/lib/audit/log"

export interface ErrorActionResult {
  ok: boolean
  error?: string
}

export async function resolveAutomationError(id: string): Promise<ErrorActionResult> {
  if (!id) return { ok: false, error: "Missing error id." }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const { data, error } = await supabase
    .from("automation_errors")
    .update({ resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select("workspace_id")
    .maybeSingle()
  if (error) return { ok: false, error: error.message }

  const workspaceId = (data as { workspace_id?: string } | null)?.workspace_id ?? null
  await recordAudit(supabase, {
    workspaceId,
    userId: user.id,
    action: "automation.error_resolved",
    resourceType: "automation_error",
    resourceId: id,
  }).catch(() => {})

  return { ok: true }
}
