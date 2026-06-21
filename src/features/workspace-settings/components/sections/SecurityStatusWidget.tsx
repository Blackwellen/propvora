"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface SecurityStatusItem {
  label: string
  status: string
  ok: boolean
}

export interface SecurityStatusWidgetProps {
  items: SecurityStatusItem[]
}

export function SecurityStatusWidget({ items }: SecurityStatusWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4">Workspace Security Status</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "p-4 rounded-xl border",
              item.ok ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
            )}
          >
            <p className="text-[11px] font-semibold text-slate-600">{item.label}</p>
            <p className={cn("text-[12px] font-bold mt-1", item.ok ? "text-emerald-700" : "text-amber-700")}>
              {item.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
