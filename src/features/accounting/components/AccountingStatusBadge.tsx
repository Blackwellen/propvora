import React from "react"
import { cn } from "@/lib/utils"

type AccountingStatus = "Posted" | "Pending" | "Exception" | "Draft" | "Submitted" | "Active" | "Inactive" | "Due" | "Not Started"

const STATUS_STYLES: Record<AccountingStatus, string> = {
  Posted: "bg-[#ECFDF5] text-[#059669]",
  Pending: "bg-[#FFFBEB] text-[#d97706]",
  Exception: "bg-[#FEF2F2] text-[#dc2626]",
  Draft: "bg-slate-100 text-slate-600",
  Submitted: "bg-[#ECFDF5] text-[#059669]",
  Active: "bg-[#ECFDF5] text-[#059669]",
  Inactive: "bg-slate-100 text-slate-500",
  Due: "bg-[#FFFBEB] text-[#d97706]",
  "Not Started": "bg-slate-100 text-slate-500",
}

export function AccountingStatusBadge({ status, className }: { status: AccountingStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600", className)}>
      {status}
    </span>
  )
}
