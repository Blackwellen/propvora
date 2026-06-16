"use client"

import React from "react"
import { Plus, Copy, RefreshCw, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import type { ContactDetail } from "./types"
import { SectionCard, FieldRow, StatusChip } from "./shared"

export function PortalAccessTab({ contact }: { contact: ContactDetail }) {
  const linkHistory = [
    { created:"2026-03-01", expires:"2026-04-01", status:"expired", opened:true },
    { created:"2026-01-10", expires:"2026-02-10", status:"expired", opened:false },
  ]
  return (
    <div className="space-y-5">
      <SectionCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-900">Current Portal Status</h4>
          <StatusChip status={contact.portal_status ?? "not_created"} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <FieldRow label="Portal Status" value={contact.portal_status ?? "Not created"} />
          <FieldRow label="Last Accessed" value="2026-03-05" />
          <FieldRow label="Link Created" value="2026-03-01" />
          <FieldRow label="Link Expires" value="2026-04-01" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>Create New Link</Button>
          <Button variant="outline" size="sm" leftIcon={<Copy className="w-3.5 h-3.5" />}>Copy Link</Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Extend</Button>
          <Button variant="destructive-soft" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Revoke</Button>
        </div>
      </SectionCard>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Link History</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Created","Expires","Status","Opened"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linkHistory.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.created}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{l.expires}</td>
                  <td className="px-4 py-3"><StatusChip status={l.status} /></td>
                  <td className="px-4 py-3">
                    {l.opened ? <Badge variant="success" size="sm" dot>Yes</Badge> : <Badge variant="default" size="sm">No</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
