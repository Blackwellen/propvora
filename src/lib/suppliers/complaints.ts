"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// ============================================================
// Tenant complaint / reopen flow — a lightweight issue/escalation on a
// completed job. Live table `job_complaints`
// (migration 20260613000007_supplier_ratings_complaints).
//
// The tenant raises it from the tenant portal (scoped to their own job in the
// query layer); the operator reads/manages it under work. 42P01-safe.
// ============================================================

function code(e: unknown): string | undefined {
  return (e as { code?: string } | null)?.code
}

export type ComplaintStatus = "open" | "acknowledged" | "resolved" | "closed"
export type ComplaintSeverity = "low" | "medium" | "high" | "urgent"

export interface JobComplaint {
  id: string
  workspace_id: string
  job_id: string
  tenant_contact_id: string | null
  category: string | null
  description: string
  severity: ComplaintSeverity
  status: ComplaintStatus
  resolution_notes: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export const COMPLAINT_STATUS_META: Record<
  ComplaintStatus,
  { label: string; badge: string }
> = {
  open: { label: "Open", badge: "bg-red-50 text-red-700 border-red-200" },
  acknowledged: { label: "Acknowledged", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  resolved: { label: "Resolved", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", badge: "bg-slate-100 text-slate-500 border-slate-200" },
}

export const COMPLAINT_SEVERITY_META: Record<
  ComplaintSeverity,
  { label: string; badge: string }
> = {
  low: { label: "Low", badge: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  high: { label: "High", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  urgent: { label: "Urgent", badge: "bg-red-50 text-red-700 border-red-200" },
}

export const COMPLAINT_CATEGORIES = [
  "Work not completed",
  "Poor quality",
  "Issue returned",
  "Damage caused",
  "New related issue",
  "Other",
] as const

// ─── Operator: complaints across the workspace (optionally filtered) ──────────

export function useWorkspaceComplaints(
  workspaceId: string | undefined,
  opts?: { jobId?: string; enabled?: boolean }
) {
  const supabase = createClient()
  return useQuery<JobComplaint[]>({
    queryKey: ["job-complaints", workspaceId, opts?.jobId ?? "all"],
    enabled: !!workspaceId && (opts?.enabled ?? true),
    staleTime: 30 * 1000,
    queryFn: async () => {
      let q = supabase
        .from("job_complaints")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .order("created_at", { ascending: false })
      if (opts?.jobId) q = q.eq("job_id", opts.jobId)
      const { data, error } = await q
      if (error) {
        if (code(error) === "42P01") return []
        throw error
      }
      return (data ?? []) as JobComplaint[]
    },
  })
}

// ─── Tenant: complaints they raised, scoped to their own job ids ──────────────

export function useTenantComplaints(
  workspaceId: string | undefined,
  jobIds: string[],
  enabled = true
) {
  const supabase = createClient()
  return useQuery<JobComplaint[]>({
    queryKey: ["tenant-complaints", workspaceId, jobIds.slice().sort().join(",")],
    enabled: !!workspaceId && jobIds.length > 0 && enabled,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_complaints")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .in("job_id", jobIds)
        .order("created_at", { ascending: false })
      if (error) {
        if (code(error) === "42P01") return []
        throw error
      }
      return (data ?? []) as JobComplaint[]
    },
  })
}

export interface CreateComplaintInput {
  workspaceId: string
  jobId: string
  tenantContactId?: string | null
  category?: string | null
  description: string
  severity?: ComplaintSeverity
}

/** Tenant raises an issue / reopens a completed job. Returns the new row. */
export function useCreateComplaint() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateComplaintInput) => {
      const { data, error } = await supabase
        .from("job_complaints")
        .insert({
          workspace_id: input.workspaceId,
          job_id: input.jobId,
          tenant_contact_id: input.tenantContactId ?? null,
          category: input.category ?? null,
          description: input.description,
          severity: input.severity ?? "medium",
          status: "open",
        })
        .select("*")
        .single()
      if (error) throw error
      return data as JobComplaint
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tenant-complaints", vars.workspaceId] })
      qc.invalidateQueries({ queryKey: ["job-complaints", vars.workspaceId] })
    },
  })
}

/** Operator updates a complaint's status / resolution notes. */
export function useUpdateComplaint() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      workspaceId: string
      patch: Partial<Pick<JobComplaint, "status" | "resolution_notes">>
    }) => {
      const patch: Record<string, unknown> = { ...args.patch }
      if (args.patch.status === "resolved" || args.patch.status === "closed") {
        patch.resolved_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from("job_complaints")
        .update(patch)
        .eq("id", args.id)
        .eq("workspace_id", args.workspaceId)
        .select("*")
        .single()
      if (error) throw error
      return data as JobComplaint
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["job-complaints", vars.workspaceId] })
      qc.invalidateQueries({ queryKey: ["tenant-complaints", vars.workspaceId] })
    },
  })
}
