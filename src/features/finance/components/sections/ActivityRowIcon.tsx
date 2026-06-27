"use client"

import { CheckCircle, AlertTriangle, RefreshCw, FileText } from "lucide-react"

interface ActivityRowIconProps {
  eventType: string
}

export function ActivityRowIcon({ eventType }: ActivityRowIconProps) {
  if (eventType.includes("paid") || eventType.includes("received")) {
    return (
      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      </div>
    )
  }
  if (eventType.includes("overdue") || eventType.includes("arrears")) {
    return (
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
      </div>
    )
  }
  if (eventType.includes("refund") || eventType.includes("return")) {
    return (
      <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
        <RefreshCw className="w-4 h-4 text-yellow-500" />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] flex items-center justify-center shrink-0">
      <FileText className="w-4 h-4 text-[var(--brand)]" />
    </div>
  )
}
