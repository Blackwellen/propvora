"use client"

import { Files, FileText } from "lucide-react"
import { SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"
import { timeAgo } from "@/components/supplier-workspace/format"
import type { PipelineRequest } from "@/features/supplier/requests/data/types"

export interface RequestFilesTabProps {
  request: PipelineRequest
}

export function RequestFilesTab({ request: r }: RequestFilesTabProps) {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Attached files</h2>
      </div>
      {r.files.length === 0 ? (
        <SupplierEmptyState
          icon={Files}
          title="No files attached"
          description="Photos and documents shared by the requester appear here."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {r.files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-2.5">
              <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{f.fileName}</p>
                <p className="text-xs text-slate-400">
                  {f.kind} · {f.uploadedAt ? timeAgo(f.uploadedAt) : "—"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SupplierCard>
  )
}
