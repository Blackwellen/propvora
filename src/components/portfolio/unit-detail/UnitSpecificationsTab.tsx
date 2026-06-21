"use client"

import React from "react"
import Link from "next/link"
import type { Unit } from "@/hooks/useUnits"
import { InlineEditField } from "@/components/editing"
import { cn } from "@/lib/utils"
import { Home, Shield, ArrowUpRight } from "lucide-react"
import { fmtDate, type ComplianceItemRow } from "./shared"

export function UnitSpecificationsTab({ unit, complianceItems, complianceLoaded, onSave }: {
  unit: Unit
  complianceItems: ComplianceItemRow[]
  complianceLoaded: boolean
  onSave: (field: string, value: unknown) => Promise<void>
}) {
  const specs: { label: string; field: string; type?: "number" | "select"; options?: { value: string; label: string }[]; prefix?: string }[] = [
    { label: "Unit Type", field: "unit_type", type: "select", options: [
      { value: "Room", label: "Room" }, { value: "flat", label: "Flat" }, { value: "studio", label: "Studio" },
      { value: "suite", label: "Suite" }, { value: "apartment", label: "Apartment" }, { value: "other", label: "Other" },
    ] },
    { label: "Floor", field: "floor", type: "number" },
    { label: "Bedrooms", field: "bedrooms", type: "number" },
    { label: "Bathrooms", field: "bathrooms", type: "number" },
    { label: "Floor Area (m²)", field: "floor_area_sqm", type: "number" },
    { label: "Target Rent", field: "target_rent", type: "number", prefix: "£" },
    { label: "Status", field: "status", type: "select", options: [
      { value: "occupied", label: "Occupied" }, { value: "vacant", label: "Vacant" },
      { value: "under_works", label: "Under Works" }, { value: "reserved", label: "Reserved" },
    ] },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Specifications — live, inline-editable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-4 h-4 text-blue-500" />
          <span className="text-[13px] font-bold text-slate-900">Specifications</span>
        </div>
        <div className="space-y-2.5">
          {specs.map((s) => (
            <div key={s.field} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
              <span className="text-[12px] text-slate-500">{s.label}</span>
              <InlineEditField
                value={(unit as any)[s.field] ?? ""}
                onSave={(v) => onSave(s.field, s.type === "number" ? (v ? Number(v) : null) : v)}
                type={s.type}
                options={s.options}
                prefix={s.prefix}
                label={s.label}
                displayClassName="text-[13px] font-semibold text-slate-800"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Certificates & Compliance — live from compliance_items */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[13px] font-bold text-slate-900">Certificates & Compliance</span>
          </div>
          <Link href={`/property-manager/compliance?unit=${unit.id}`} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-0.5">
            Open <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {complianceItems.length === 0 ? (
          <div className="py-8 text-center">
            <Shield className="w-7 h-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[12px] text-slate-500">{complianceLoaded ? "No compliance items tracked for this unit" : "Loading…"}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {complianceItems.map((c) => {
              const overdue = c.due_date ? new Date(c.due_date).getTime() < Date.now() : false
              return (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-600">{c.title ?? c.type ?? "Item"}</span>
                  <span className={cn("text-[12px] font-semibold", overdue ? "text-red-600" : "text-slate-800")}>{c.due_date ? `Due ${fmtDate(c.due_date)}` : (c.status ?? "—")}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
