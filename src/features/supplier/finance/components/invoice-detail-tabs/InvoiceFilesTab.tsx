"use client"

import { Files } from "lucide-react"
import { SupplierCard, SupplierEmptyState } from "@/components/supplier-workspace/ui"

export function InvoiceFilesTab() {
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Files</h2>
      </div>
      <SupplierEmptyState
        icon={Files}
        title="No documents"
        description="The invoice PDF and any attachments appear here."
      />
    </SupplierCard>
  )
}
