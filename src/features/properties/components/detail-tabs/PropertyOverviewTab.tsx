"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Building2, MapPin, Home, Users, DollarSign, ShieldCheck } from "lucide-react"

export interface PropertyDetailSummary {
  id: string
  name: string
  address: string
  status: string
  propertyType?: string
  unitCount?: number
  occupiedCount?: number
  targetRentMonthly?: number
  portfolioHealth?: string
  epcRating?: string
  licenceType?: string
}

export interface PropertyOverviewTabProps {
  property: PropertyDetailSummary
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  const occupancyRate =
    property.unitCount && property.unitCount > 0
      ? Math.round(((property.occupiedCount ?? 0) / property.unitCount) * 100)
      : 0

  const details = [
    { label: "Status",       value: property.status,                                              icon: Home       },
    { label: "Type",         value: property.propertyType ?? "—",                                 icon: Building2  },
    { label: "Address",      value: property.address,                                              icon: MapPin     },
    { label: "Units",        value: property.unitCount ? `${property.unitCount} units` : "—",     icon: Home       },
    { label: "Occupancy",    value: property.unitCount ? `${occupancyRate}%` : "—",               icon: Users      },
    { label: "Target rent",  value: property.targetRentMonthly ? `£${property.targetRentMonthly.toLocaleString()}/mo` : "—", icon: DollarSign },
    { label: "Health",       value: property.portfolioHealth ?? "—",                              icon: ShieldCheck},
    { label: "EPC rating",   value: property.epcRating ?? "—",                                    icon: ShieldCheck},
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4">{property.name}</h3>
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

export default PropertyOverviewTab
