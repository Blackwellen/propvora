import React from "react"
import { cn } from "@/lib/utils"
import { type JobWizardData, JOB_CATEGORIES, JOB_PRIORITIES } from "./job-wizard-shared"

interface JobStepReviewProps {
  data: JobWizardData
}

export function JobStepReview({ data }: JobStepReviewProps) {
  const rows: [string, string][] = [
    ["Title", data.title || "—"],
    ["Category", JOB_CATEGORIES.find((c) => c.key === data.category)?.label ?? data.category],
    ["Priority", JOB_PRIORITIES.find((p) => p.key === data.priority)?.label ?? data.priority],
    ["Property", data.propertyName || "—"],
    ["Supplier", data.supplierName || "—"],
    ["Revenue blocking", data.revenueBlocking ? "Yes" : "No"],
    ["Occupancy blocking", data.occupancyBlocking ? "Yes" : "No"],
    ["Scheduled", data.scheduledDate ? new Date(data.scheduledDate).toLocaleDateString("en-GB") : "—"],
    ["Time", data.scheduledTime || "—"],
    ["Duration", data.estimatedDuration || "—"],
    ["Quoted", data.quotedAmount ? `£${data.quotedAmount.toLocaleString()}` : "—"],
    ["Approved", data.approvedAmount ? `£${data.approvedAmount.toLocaleString()}` : "—"],
    ["Send portal link", data.sendPortalLink ? "Yes" : "No"],
  ]
  return (
    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      {rows.map(([label, value], i) => (
        <div key={label} className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
          <span className="text-slate-500">{label}</span>
          <span className="font-medium text-slate-900 text-right">{value}</span>
        </div>
      ))}
    </div>
  )
}
