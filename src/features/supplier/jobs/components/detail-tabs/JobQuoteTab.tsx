"use client"

import Link from "next/link"
import { SupplierCard } from "@/components/supplier-workspace/ui"
import type { SupplierAssignmentRow } from "@/components/supplier-workspace/types"

export interface JobQuoteTabProps {
  job: SupplierAssignmentRow
}

export function JobQuoteTab({ job }: JobQuoteTabProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Quote</h2>
      {job.quote_id ? (
        <p className="text-sm text-slate-500">
          This job originated from quote{" "}
          <span className="font-mono text-slate-700">{job.quote_id.slice(0, 8)}</span>. The agreed amount and terms
          live on the quote record. See{" "}
          <Link href="/supplier/quotes" className="font-semibold text-[var(--brand)]">
            Quotes
          </Link>
          .
        </p>
      ) : (
        <p className="text-sm text-slate-500">This job was assigned directly without a marketplace quote.</p>
      )}
    </SupplierCard>
  )
}
