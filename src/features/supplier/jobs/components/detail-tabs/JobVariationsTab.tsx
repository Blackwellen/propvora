"use client"

import Link from "next/link"
import { SupplierCard } from "@/components/supplier-workspace/ui"

export function JobVariationsTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Variations</h2>
      <p className="text-sm text-slate-500">
        Extra work beyond the agreed scope should be quoted separately so it is approved and paid correctly. Raise a new
        quote from{" "}
        <Link href="/supplier/quotes" className="font-semibold text-[#2563EB]">
          Quotes
        </Link>{" "}
        and reference this job.
      </p>
    </SupplierCard>
  )
}
