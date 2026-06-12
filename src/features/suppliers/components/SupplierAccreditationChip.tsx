import React from "react"
import { ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  label: string
  className?: string
}

export function SupplierAccreditationChip({ label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap",
        className
      )}
    >
      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
      {label}
    </span>
  )
}
