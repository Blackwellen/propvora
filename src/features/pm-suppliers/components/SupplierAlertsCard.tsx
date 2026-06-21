import React from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertItem {
  label: string
  href: string
  actionLabel?: string
}

export interface SupplierAlertsCardProps {
  alerts: AlertItem[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierAlertsCard({ alerts }: SupplierAlertsCardProps) {
  if (alerts.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="text-[12.5px] font-semibold text-amber-800">Attention needed</span>
      </div>
      <div className="text-[12px] text-amber-700 space-y-1.5">
        {alerts.map((a) => (
          <div key={a.label} className="flex items-center justify-between">
            <span>{a.label}</span>
            <Link href={a.href} className="font-medium hover:underline">
              {a.actionLabel ?? "Review"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
