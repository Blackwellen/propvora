"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Home, Users, DollarSign, Calendar, ShieldCheck } from "lucide-react"

export interface UnitSummary {
  id: string
  name: string
  status: string
  bedrooms?: number
  bathrooms?: number
  floorArea?: number
  targetRent?: number
  tenantName?: string
  tenancyEnd?: string
  complianceStatus?: "valid" | "expiring" | "expired"
}

export interface UnitOverviewTabProps {
  unit: UnitSummary
}

export function UnitOverviewTab({ unit }: UnitOverviewTabProps) {
  const details = [
    { label: "Status",      value: unit.status,                                 icon: Home       },
    { label: "Bedrooms",    value: unit.bedrooms ? `${unit.bedrooms} bed` : "—", icon: Home       },
    { label: "Bathrooms",   value: unit.bathrooms ? `${unit.bathrooms} bath`: "—",icon: Home      },
    { label: "Floor area",  value: unit.floorArea ? `${unit.floorArea} sqft` : "—",icon: Home     },
    { label: "Target rent", value: unit.targetRent ? `£${unit.targetRent.toLocaleString()}/mo` : "—", icon: DollarSign },
    { label: "Tenant",      value: unit.tenantName ?? "Vacant",                 icon: Users      },
    { label: "Tenancy end", value: unit.tenancyEnd ?? "—",                      icon: Calendar   },
    { label: "Compliance",  value: unit.complianceStatus ?? "—",                icon: ShieldCheck},
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4">Unit Overview — {unit.name}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {details.map((d) => {
          const Icon = d.icon
          return (
            <div key={d.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {d.label}
              </div>
              <p className="text-[13px] font-semibold text-slate-900">{d.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UnitOverviewTab
