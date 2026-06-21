"use client"

import React from "react"
import { useWorkspace } from "@/providers/AuthProvider"
import { EvidenceUpload } from "@/components/work/EvidenceUpload"
import { TenancySectionCard } from "./TenancySectionCard"

interface TenancyDocumentsTabProps {
  tenancyId: string
}

export function TenancyDocumentsTab({ tenancyId }: TenancyDocumentsTabProps) {
  const { workspace } = useWorkspace()

  return (
    <div className="mt-4 flex flex-col gap-4">
      <TenancySectionCard className="p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">Tenancy Documents</h3>
        <EvidenceUpload
          workspaceId={workspace?.id}
          folder="tenancy-documents"
          table="property_documents"
          extra={{ tenancy_id: tenancyId }}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        />
        <p className="text-[11px] text-slate-500 mt-3">
          Lease agreements, right-to-rent checks, guarantor and inventory documents. Files are stored securely.
        </p>
      </TenancySectionCard>
    </div>
  )
}
