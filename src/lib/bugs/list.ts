import { createAdminClient } from "@/lib/supabase/admin"
import type { BugKind } from "@/lib/bugs/sanitise"

// Admin-side reader for the bug inbox (MAX-RELEASE item 197). Reads via the
// service role (the table is RLS deny-all). Mirrors the schema-gap handling used
// across the admin ops layer so a not-yet-applied migration degrades gracefully.

const MISSING_RELATION = "42P01"

function isSchemaGap(code?: string | null): boolean {
  return code === MISSING_RELATION
}

export type BugStatus = "new" | "triaged" | "resolved" | "ignored"

export interface BugReportRow {
  id: string
  kind: BugKind
  status: BugStatus
  route: string | null
  message: string | null
  digest: string | null
  workspaceId: string | null
  userId: string | null
  createdAt: string | null
}

export interface BugReportList {
  /** False when the bug_reports table is not provisioned (migration not applied). */
  available: boolean
  rows: BugReportRow[]
  total: number
  newCount: number
}

/**
 * List the most recent bug reports (newest first). Returns available:false when
 * the table is missing, and an empty list (available:true) on any other error.
 */
export async function listBugReports(limit = 200): Promise<BugReportList> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { available: false, rows: [], total: 0, newCount: 0 }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("bug_reports")
      .select("id, kind, status, route, message, digest, workspace_id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      if (isSchemaGap((error as { code?: string }).code)) {
        return { available: false, rows: [], total: 0, newCount: 0 }
      }
      return { available: true, rows: [], total: 0, newCount: 0 }
    }

    const rows: BugReportRow[] = (data ?? []).map((r) => ({
      id: r.id as string,
      kind: (r.kind as BugKind) ?? "error",
      status: (r.status as BugStatus) ?? "new",
      route: (r.route as string | null) ?? null,
      message: (r.message as string | null) ?? null,
      digest: (r.digest as string | null) ?? null,
      workspaceId: (r.workspace_id as string | null) ?? null,
      userId: (r.user_id as string | null) ?? null,
      createdAt: (r.created_at as string | null) ?? null,
    }))

    return {
      available: true,
      rows,
      total: rows.length,
      newCount: rows.filter((r) => r.status === "new").length,
    }
  } catch {
    return { available: false, rows: [], total: 0, newCount: 0 }
  }
}
