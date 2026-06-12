import React from "react"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ComplianceStatus = "valid" | "expiring" | "expired" | "unknown"

interface Props {
  status: ComplianceStatus
  label?: string
  nextReview?: string
}

const CONFIG: Record<ComplianceStatus, { icon: React.ElementType; classes: string; defaultLabel: string }> = {
  valid:    { icon: CheckCircle2,   classes: "text-emerald-600", defaultLabel: "All documents valid" },
  expiring: { icon: AlertTriangle,  classes: "text-amber-600",   defaultLabel: "Expiring soon" },
  expired:  { icon: XCircle,        classes: "text-red-600",     defaultLabel: "Documents expired" },
  unknown:  { icon: AlertTriangle,  classes: "text-slate-400",   defaultLabel: "Status unknown" },
}

export function SupplierComplianceStatus({ status, label, nextReview }: Props) {
  const cfg = CONFIG[status]
  const Icon = cfg.icon
  return (
    <div className="flex flex-col gap-0.5">
      <div className={cn("flex items-center gap-1 text-xs font-semibold", cfg.classes)}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label ?? cfg.defaultLabel}</span>
      </div>
      {nextReview && (
        <p className="text-[10px] text-slate-400 pl-5">Next review: {nextReview}</p>
      )}
    </div>
  )
}
