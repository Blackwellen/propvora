"use client"

import { CheckCircle2, Circle } from "lucide-react"
import { SupplierCard } from "@/components/supplier-workspace/ui"

export interface ReadinessItem {
  label: string
  ok: boolean
}

export interface InvoiceWizardProgressProps {
  items: ReadinessItem[]
}

export function InvoiceWizardProgress({ items }: InvoiceWizardProgressProps) {
  return (
    <SupplierCard className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Readiness</p>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.label} className="flex items-start gap-2 text-xs">
            {r.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
            )}
            <span className={r.ok ? "text-slate-600" : "text-slate-400"}>{r.label}</span>
          </li>
        ))}
      </ul>
    </SupplierCard>
  )
}
