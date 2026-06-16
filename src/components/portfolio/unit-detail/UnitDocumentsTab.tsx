"use client"

import React from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"

export function UnitDocumentsTab({ unitId }: { unitId: string }) {
  const { workspace } = useWorkspace()

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Unit Documents</h3>
        <EvidenceUpload
          workspaceId={workspace?.id}
          folder="unit-documents"
          table="property_documents"
          extra={{ unit_id: unitId }}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        />
        <p className="text-[11px] text-slate-500 mt-3">Photos, floorplans, certificates and reports for this unit. Files are stored securely.</p>
      </div>
    </div>
  )
}
