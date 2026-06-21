"use client"

import Link from "next/link"
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react"
import { SupplierCard, SupplierButton } from "@/components/supplier-workspace/ui"

export interface EscrowCondition {
  id: string
  label: string
  met: boolean
}

export interface PayoutEscrowConditionsProps {
  conditions: EscrowCondition[]
  blockersRef: string
  openBlockersCount: number
}

export function PayoutEscrowConditions({
  conditions, blockersRef, openBlockersCount,
}: PayoutEscrowConditionsProps) {
  const metCount = conditions.filter((c) => c.met).length
  return (
    <SupplierCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Release conditions</h2>
        <span className="text-xs font-semibold text-slate-400">{metCount}/{conditions.length}</span>
      </div>
      <ul className="space-y-2.5">
        {conditions.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            {c.met ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
            )}
            <span className={c.met ? "text-slate-600" : "text-slate-800 font-medium"}>{c.label}</span>
          </li>
        ))}
      </ul>
      {openBlockersCount > 0 && (
        <Link href={blockersRef} className="mt-4 block">
          <SupplierButton className="w-full justify-center">
            <AlertTriangle className="w-4 h-4" /> Resolve blockers
          </SupplierButton>
        </Link>
      )}
    </SupplierCard>
  )
}
