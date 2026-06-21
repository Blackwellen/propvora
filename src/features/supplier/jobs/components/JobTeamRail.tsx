"use client"

import Link from "next/link"
import { SupplierCard, SupplierButton } from "@/components/supplier-workspace/ui"

export interface JobTeamRailProps {
  onReassign: () => void
}

export function JobTeamRail({ onReassign }: JobTeamRailProps) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Team</h2>
      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-slate-500">Assigned worker</dt>
          <dd className="text-sm font-semibold text-slate-800 text-right">Jake Foster</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-slate-500">Dispatcher</dt>
          <dd className="text-sm font-semibold text-slate-800 text-right">Alex Morgan</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-slate-500">Cost variance</dt>
          <dd className="text-sm font-semibold text-slate-800 text-right">+£0.00</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-slate-500">Profit estimate</dt>
          <dd className="text-sm font-semibold text-slate-800 text-right">42%</dd>
        </div>
      </dl>
      <div className="mt-3 flex gap-2">
        <SupplierButton size="sm" variant="outline" onClick={onReassign}>Reassign</SupplierButton>
        <Link href="/supplier/jobs?tab=dispatch">
          <SupplierButton size="sm" variant="ghost">Dispatch board</SupplierButton>
        </Link>
      </div>
    </SupplierCard>
  )
}
