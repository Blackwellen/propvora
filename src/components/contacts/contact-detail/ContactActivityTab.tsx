"use client"

import React from "react"
import { CheckCircle2, FileText, ListChecks, AlertTriangle, Activity, StickyNote, Globe, Shield } from "lucide-react"
import type { ActivityRecord } from "./types"
import { EmptyState } from "./shared"

export function ActivityTimeline({ items }: { items: ActivityRecord[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    payment:  <div style={{ color: "#10B981" }}><CheckCircle2 className="w-4 h-4" /></div>,
    document: <div style={{ color: "#2563EB" }}><FileText className="w-4 h-4" /></div>,
    task:     <div style={{ color: "#F59E0B" }}><ListChecks className="w-4 h-4" /></div>,
    alert:    <div style={{ color: "#EF4444" }}><AlertTriangle className="w-4 h-4" /></div>,
    system:   <div style={{ color: "#94a3b8" }}><Activity className="w-4 h-4" /></div>,
    note:     <div style={{ color: "#8B5CF6" }}><StickyNote className="w-4 h-4" /></div>,
    portal:   <div style={{ color: "#0EA5E9" }}><Globe className="w-4 h-4" /></div>,
  }

  if (items.length === 0) return <EmptyState icon={Activity} message="No activity recorded yet." />

  return (
    <div className="relative space-y-4 pl-4">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 relative">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 z-10 -ml-4">
            {iconMap[a.type] ?? <div style={{ color: "#94a3b8" }}><Activity className="w-4 h-4" /></div>}
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

export function AuditTab() {
  const rows = [
    { who: "System", action: "Contact created", field: "—", when: "2026-01-15 09:23" },
    { who: "admin@propvora.com", action: "Email updated", field: "email", when: "2026-02-01 14:12" },
    { who: "admin@propvora.com", action: "Tag added: reliable", field: "tags", when: "2026-02-01 14:13" },
    { who: "System", action: "Tenancy linked", field: "tenancy_id", when: "2026-02-01 14:15" },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Full change log — admin visible only</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Who","Action","Field","When"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-700 font-medium">{r.who}</td>
                <td className="px-4 py-3 text-slate-700">{r.action}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.field}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
