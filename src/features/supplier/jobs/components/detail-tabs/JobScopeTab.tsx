"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

export interface JobScopeTabProps {
  job: SupplierAssignmentRow
}

export function JobScopeTab({ job }: JobScopeTabProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Scope of work</h2>
      <p className="text-sm text-slate-500">
        {job.quote_id
          ? "This job was created from a quote you submitted. The agreed scope is the description and price of that accepted quote — see the Quote tab."
          : "This job was assigned directly. Confirm the scope with the property manager via Messages before starting work."}
      </p>
    </SupplierCard>
  )
}
