"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, FileText, ListChecks, AlertTriangle, Activity, StickyNote, Globe, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ActivityRecord } from "./types"
import { EmptyState } from "./shared"

export function ActivityTimeline({ items }: { items: ActivityRecord[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    payment:  <div style={{ color: "var(--color-success-500, #10B981)" }}><CheckCircle2 className="w-4 h-4" /></div>,
    document: <div style={{ color: "#2563EB" }}><FileText className="w-4 h-4" /></div>,
    task:     <div style={{ color: "var(--color-warning-500, #F59E0B)" }}><ListChecks className="w-4 h-4" /></div>,
    alert:    <div style={{ color: "var(--color-danger-500, #EF4444)" }}><AlertTriangle className="w-4 h-4" /></div>,
    system:   <div style={{ color: "var(--text-disabled)" }}><Activity className="w-4 h-4" /></div>,
    note:     <div style={{ color: "var(--color-ai-500, #8B5CF6)" }}><StickyNote className="w-4 h-4" /></div>,
    portal:   <div style={{ color: "var(--color-sky-500, #0EA5E9)" }}><Globe className="w-4 h-4" /></div>,
  }

  if (items.length === 0) return <EmptyState icon={Activity} message="No activity recorded yet." />

  return (
    <div className="relative space-y-4 pl-4">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 z-10 -ml-4">
            {iconMap[a.type] ?? <div style={{ color: "var(--text-disabled)" }}><Activity className="w-4 h-4" /></div>}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-slate-800">{a.action}</p>
            <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface AuditRow { id: string; user_id: string | null; action: string; resource_type: string | null; created_at: string }

function useContactAudit(workspaceId: string | undefined, contactId: string) {
  return useQuery<AuditRow[]>({
    queryKey: ["contact-audit", workspaceId, contactId],
    enabled: !!workspaceId && !!contactId,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, action, resource_type, created_at")
        .eq("workspace_id", workspaceId!)
        .eq("resource_id", contactId)
        .order("created_at", { ascending: false })
        .limit(100)
      if (error) {
        if (error.code === "42P01") return []
        throw error
      }
      return (data ?? []) as AuditRow[]
    },
  })
}

export function AuditTab({ contactId, workspaceId }: { contactId: string; workspaceId: string | undefined }) {
  const { data: rows = [], isLoading } = useContactAudit(workspaceId, contactId)

  if (isLoading) return <div className="py-10 text-center text-sm text-slate-400">Loading audit log…</div>
  if (rows.length === 0) return <EmptyState icon={Shield} message="No audit entries recorded for this contact yet." />

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Full change log — admin visible only</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Who","Action","Resource","When"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-700 font-medium">{r.user_id ? `${r.user_id.slice(0, 8)}…` : "System"}</td>
                <td className="px-4 py-3 text-slate-700">{r.action.replace(/[._]/g, " ")}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.resource_type ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
