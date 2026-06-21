"use client"

import { SupplierCard } from "@/components/supplier-workspace/ui"

export function JobAccessTab() {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-2">Property access</h2>
      <p className="text-sm text-slate-500">
        Access details (key collection, alarm codes, tenant contact, parking) are shared by the property manager via
        Messages for security. Never store sensitive access codes in evidence or notes.
      </p>
    </SupplierCard>
  )
}
