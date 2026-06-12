import type { SupabaseClient } from "@supabase/supabase-js"

// ============================================================================
// Live workspace context for the AI Copilot.
//
// Produces a concise, FACTUAL snapshot of the caller's current workspace so the
// model answers from real data instead of generic guesses. Every query is
// 42P01/42703-safe (missing table or column → that metric is simply omitted),
// and all counts run under the caller's RLS-scoped Supabase client, so the AI
// can never see data outside the active workspace.
//
// We deliberately use head-only COUNT queries (no row payloads) so this stays
// cheap, leaks no record contents into the prompt, and is resilient to the
// column-name drift that exists across this schema.
// ============================================================================

export interface WorkspaceSnapshot {
  properties?: number
  units?: number
  activeTenancies?: number
  openTasks?: number
  openJobs?: number
  contacts?: number
  documents?: number
}

/** Safe head-count for a table filtered by workspace. Returns undefined on any error. */
async function safeCount(
  supabase: SupabaseClient,
  table: string,
  workspaceId: string,
  extra?: (q: any) => any
): Promise<number | undefined> {
  try {
    let q: any = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
    if (extra) q = extra(q)
    const { count, error } = await q
    if (error) return undefined
    return count ?? undefined
  } catch {
    return undefined
  }
}

/**
 * Build a live snapshot of the workspace. Runs all counts in parallel.
 * Never throws — partial results are expected and fine.
 */
export async function getWorkspaceSnapshot(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspaceSnapshot> {
  if (!workspaceId || workspaceId === "demo-workspace") return {}

  const [properties, units, activeTenancies, openTasks, openJobs, contacts, documents] =
    await Promise.all([
      safeCount(supabase, "properties", workspaceId),
      safeCount(supabase, "units", workspaceId),
      safeCount(supabase, "tenancies", workspaceId, (q) => (q as any).eq("status", "active")),
      safeCount(supabase, "tasks", workspaceId, (q) => (q as any).neq("status", "done")),
      safeCount(supabase, "jobs", workspaceId, (q) =>
        (q as any).in("status", ["open", "scheduled", "in_progress", "assigned"])
      ),
      safeCount(supabase, "contacts", workspaceId),
      safeCount(supabase, "documents", workspaceId),
    ])

  return { properties, units, activeTenancies, openTasks, openJobs, contacts, documents }
}

/** Render the snapshot as a compact factual block for the system prompt. */
export function renderSnapshot(snap: WorkspaceSnapshot): string {
  const lines: string[] = []
  const add = (label: string, n?: number) => {
    if (typeof n === "number") lines.push(`- ${label}: ${n}`)
  }
  add("Properties", snap.properties)
  add("Units", snap.units)
  add("Active tenancies", snap.activeTenancies)
  add("Open tasks", snap.openTasks)
  add("Open jobs", snap.openJobs)
  add("Contacts", snap.contacts)
  add("Documents", snap.documents)

  if (lines.length === 0) {
    return "No workspace records are available yet (this may be a new or empty workspace)."
  }
  return `Live workspace data (current counts, scoped to this workspace only):\n${lines.join("\n")}`
}
