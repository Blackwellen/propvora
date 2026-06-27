import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { captureException, requestIdFrom } from "@/lib/observability"
import { isSupplierWorkspaceMember } from "@/lib/supplier/api-gate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/supplier/invoices/billable?workspaceId=...
 *
 * Returns completed job assignments for this supplier workspace that have NOT yet
 * been invoiced, shaped for the invoice wizard's job picker (BillableJob):
 *   { id, ref, title, customer, workspace, defaultPence }
 *
 * Joins each completed assignment to its quote (title + amount) and the operator
 * workspace (name). Defensive: tolerates missing tables/columns (returns []).
 */

function tolerable(e: unknown): boolean {
  const c = (e as { code?: string } | null)?.code
  return c === "42P01" || c === "42703" || c === "PGRST205" || c === "PGRST200"
}

interface AssignmentRow {
  id: string
  quote_id: string | null
  operator_workspace_id: string
  status: string
  completed_at: string | null
}

export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

    const url = new URL(request.url)
    const workspaceId = (url.searchParams.get("workspaceId") ?? "").trim()
    if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 })
    if (!(await isSupplierWorkspaceMember(supabase, workspaceId, user.id))) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
    }

    // 1) Completed assignments for this supplier workspace.
    let assignments: AssignmentRow[] = []
    try {
      const { data, error } = await supabase
        .from("supplier_job_assignments")
        .select("id, quote_id, operator_workspace_id, status, completed_at")
        .eq("supplier_workspace_id", workspaceId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(200)
      if (error) {
        if (tolerable(error)) return NextResponse.json({ items: [] })
        throw error
      }
      assignments = (data as AssignmentRow[] | null) ?? []
    } catch (e) {
      if (tolerable(e)) return NextResponse.json({ items: [] })
      throw e
    }
    if (assignments.length === 0) return NextResponse.json({ items: [] })

    // 2) Exclude assignments already invoiced.
    const invoicedAssignmentIds = new Set<string>()
    try {
      const { data } = await supabase
        .from("supplier_workspace_invoices")
        .select("assignment_id")
        .eq("workspace_id", workspaceId)
        .not("assignment_id", "is", null)
        .neq("status", "void")
      for (const row of (data as { assignment_id: string | null }[] | null) ?? []) {
        if (row.assignment_id) invoicedAssignmentIds.add(row.assignment_id)
      }
    } catch {
      // tolerate — if we can't read invoices, just don't exclude any
    }

    const pending = assignments.filter((a) => !invoicedAssignmentIds.has(a.id))
    if (pending.length === 0) return NextResponse.json({ items: [] })

    // 3) Fetch quote title/amount for the pending assignments.
    const quoteIds = pending.map((a) => a.quote_id).filter((q): q is string => Boolean(q))
    const quoteById = new Map<string, { title: string | null; amount_pence: number | null }>()
    if (quoteIds.length > 0) {
      try {
        const { data } = await supabase
          .from("supplier_marketplace_quotes")
          .select("id, title, amount_pence")
          .in("id", quoteIds)
        for (const q of (data as { id: string; title: string | null; amount_pence: number | null }[] | null) ?? []) {
          quoteById.set(q.id, { title: q.title, amount_pence: q.amount_pence })
        }
      } catch {
        // tolerate — fall back to generic titles/amounts
      }
    }

    // 4) Operator workspace names.
    const operatorIds = Array.from(new Set(pending.map((a) => a.operator_workspace_id)))
    const wsName = new Map<string, string>()
    if (operatorIds.length > 0) {
      try {
        const { data } = await supabase
          .from("workspaces")
          .select("id, name")
          .in("id", operatorIds)
        for (const w of (data as { id: string; name: string | null }[] | null) ?? []) {
          wsName.set(w.id, w.name ?? "Client")
        }
      } catch {
        // tolerate
      }
    }

    const items = pending.map((a) => {
      const q = a.quote_id ? quoteById.get(a.quote_id) : undefined
      const customer = wsName.get(a.operator_workspace_id) ?? "Client"
      return {
        id: a.id,
        ref: `JOB-${a.id.slice(0, 8).toUpperCase()}`,
        title: q?.title ?? "Completed job",
        customer,
        workspace: customer,
        defaultPence: q?.amount_pence ?? 0,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    captureException(err, { source: "api/supplier/invoices/billable GET", requestId })
    return NextResponse.json({ error: "Failed to load billable jobs", requestId }, { status: 500 })
  }
}
