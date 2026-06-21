import React from "react"
import { cn } from "@/lib/utils"
import { type TaskWizardData, CATEGORIES, PRIORITIES } from "./task-wizard-shared"

interface TaskStepReviewProps {
  data: TaskWizardData
}

export function TaskStepReview({ data }: TaskStepReviewProps) {
  const rows: [string, string][] = [
    ["Title", data.title || "—"],
    ["Category", CATEGORIES.find((c) => c.key === data.category)?.label ?? data.category],
    ["Priority", PRIORITIES.find((p) => p.key === data.priority)?.label ?? data.priority],
    ["Property", data.propertyName || "—"],
    ["Due date", data.dueDate ? new Date(data.dueDate).toLocaleDateString("en-GB") : "—"],
    ["Assignee", data.assignee || "—"],
    ["Est. cost", data.estimatedCost ? `£${data.estimatedCost.toLocaleString()}` : "—"],
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
