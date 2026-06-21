"use client"

import Link from "next/link"
import { Check, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface PropertyOption {
  id: string
  name: string
  address_line1?: string | null
}

interface UnitStepPropertyData {
  property_id: string
}

interface UnitStepPropertyProps {
  data: UnitStepPropertyData
  onChange: (d: Partial<UnitStepPropertyData>) => void
  properties: PropertyOption[]
}

export function UnitStepProperty({ data, onChange, properties }: UnitStepPropertyProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">Which property does this unit belong to?</p>
      <div className="flex flex-col gap-2">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-3 border-2 border-dashed border-slate-200 rounded-2xl">
            <Building2 className="w-8 h-8 text-slate-200" />
            <p className="text-sm text-slate-500">No properties yet</p>
            <Button variant="soft" size="sm" asChild>
              <Link href="/property-manager/portfolio/properties/new">Add a property first</Link>
            </Button>
          </div>
        ) : (
          properties.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ property_id: p.id })}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                data.property_id === p.id
                  ? "border-[#2563EB] bg-blue-50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
                {p.address_line1 && <p className="text-xs text-slate-500 truncate">{p.address_line1}</p>}
              </div>
              {data.property_id === p.id && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
