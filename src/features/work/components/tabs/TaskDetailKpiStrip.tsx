import React from "react"
import Link from "next/link"
import { Calendar, Clock, DollarSign, Paperclip, MessageSquare } from "lucide-react"

interface TaskView {
  slaCompliance: number
  slaTarget: string
  slaDue: string
  dueDate: string
  dueDays: string
  timeRemaining: string
  costImpact: string
  costLabel: string
  attachments: number
  comments: number
}

interface TaskDetailKpiStripProps {
  task: TaskView
  setActiveTab: (tab: string) => void
}

export function TaskDetailKpiStrip({ task, setActiveTab }: TaskDetailKpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {/* SLA compliance */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-start gap-3">
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none"
              stroke={task.slaCompliance >= 90 ? "#10B981" : task.slaCompliance >= 70 ? "#F59E0B" : "#EF4444"}
              strokeWidth="4"
              strokeDasharray={`${task.slaCompliance * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-700">{task.slaCompliance}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{task.slaCompliance}%</p>
          <p className="text-[11px] text-slate-500">SLA Compliance</p>
          <p className="text-[10px] text-slate-400">Target {task.slaTarget} · Due {task.slaDue}</p>
          <Link href="/property-manager/work/tasks" className="text-[10px] text-[#2563EB] font-medium">Add reminder</Link>
        </div>
      </div>

      {/* Due Date */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500">Due Date</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.dueDate}</p>
        <p className="text-[11px] text-slate-400">{task.dueDays}</p>
        <Link href="/property-manager/work/tasks" className="text-[10px] text-[#2563EB] font-medium">Add reminder</Link>
      </div>

      {/* Time Remaining */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-[11px] text-slate-500">Time Remaining</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.timeRemaining}</p>
        <p className="text-[11px] text-slate-400">Until due</p>
        <Link href="/property-manager/work/tasks" className="text-[10px] text-[#2563EB] font-medium">View timeline</Link>
      </div>

      {/* Cost Impact */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500">Cost Impact</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.costImpact}</p>
        <p className="text-[11px] text-slate-400">{task.costLabel}</p>
        <Link href="/property-manager/work/jobs" className="text-[10px] text-[#2563EB] font-medium">View breakdown</Link>
      </div>

      {/* Attachments */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
            <Paperclip className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <p className="text-[11px] text-slate-500">Attachments</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.attachments}</p>
        <p className="text-[11px] text-slate-400">Files attached</p>
        <Link href="/property-manager/work/tasks" className="text-[10px] text-[#2563EB] font-medium">View all</Link>
      </div>

      {/* Comments */}
      <div className="bg-white border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-[11px] text-slate-500">Comments</p>
        </div>
        <p className="text-base font-bold text-slate-900">{task.comments}</p>
        <p className="text-[11px] text-slate-400">Total comments</p>
        <button onClick={() => setActiveTab("Activity")} className="text-[10px] text-[#2563EB] font-medium">
          View comments
        </button>
      </div>
    </div>
  )
}
