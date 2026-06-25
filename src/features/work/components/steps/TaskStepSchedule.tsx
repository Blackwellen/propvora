import React from "react"
import { type TaskWizardData, inputClass, labelClass } from "./task-wizard-shared"

interface TaskStepScheduleProps {
  data: TaskWizardData
  onChange: (d: Partial<TaskWizardData>) => void
}

export function TaskStepSchedule({ data, onChange }: TaskStepScheduleProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Scheduled start</label>
          <input type="date" value={data.scheduledStart} onChange={(e) => onChange({ scheduledStart: e.target.value })} className={inputClass} />
          <p className="text-[11px] text-slate-400 mt-1">When work is planned to begin (used by Gantt chart)</p>
        </div>
        <div>
          <label className={labelClass}>Due date</label>
          <input type="date" value={data.dueDate} onChange={(e) => onChange({ dueDate: e.target.value })} className={inputClass} />
          <p className="text-[11px] text-slate-400 mt-1">Deadline for completion</p>
        </div>
      </div>
      <div>
        <label className={labelClass}>Assignee</label>
        <input type="text" placeholder="Assign to team member or contractor..." value={data.assignee} onChange={(e) => onChange({ assignee: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Estimated cost (£)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
          <input type="number" min={0} step={0.01} value={data.estimatedCost || ""} onChange={(e) => onChange({ estimatedCost: Number(e.target.value) })} className="w-full h-10 pl-7 pr-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" placeholder="0.00" />
        </div>
      </div>
    </div>
  )
}
