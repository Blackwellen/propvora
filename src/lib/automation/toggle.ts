"use server"

// Persist an automation's enabled/paused state to automation_definitions.
// Workspace scoping is enforced by RLS (automation_definitions_workspace_member
// allows ALL for members). Returns a small result the client can roll back on.
import { createClient } from "@/lib/supabase/server"

export interface ToggleResult {
  ok: boolean
  error?: string
}

export async function setAutomationEnabled(id: string, enabled: boolean): Promise<ToggleResult> {
  if (!id) return { ok: false, error: "Missing automation id." }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not authenticated." }
  const { error } = await supabase
    .from("automation_definitions")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
