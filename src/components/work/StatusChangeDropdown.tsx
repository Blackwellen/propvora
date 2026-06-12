"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

const TASK_STATUSES = [
  { value: "todo",        label: "To Do",       color: "bg-slate-100 text-slate-700" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700" },
  { value: "waiting",     label: "Waiting",     color: "bg-amber-100 text-amber-700" },
  { value: "blocked",     label: "Blocked",     color: "bg-red-100 text-red-700" },
  { value: "done",        label: "Done",        color: "bg-emerald-100 text-emerald-700" },
  { value: "cancelled",   label: "Cancelled",   color: "bg-slate-100 text-slate-500" },
]

const JOB_STATUSES = [
  { value: "new",                 label: "New",               color: "bg-slate-100 text-slate-700" },
  { value: "scoped",              label: "Scoped",            color: "bg-slate-100 text-slate-700" },
  { value: "supplier_requested",  label: "Supplier Requested",color: "bg-blue-100 text-blue-700" },
  { value: "quote_received",      label: "Quote Received",    color: "bg-sky-100 text-sky-700" },
  { value: "approved",            label: "Approved",          color: "bg-violet-100 text-violet-700" },
  { value: "scheduled",           label: "Scheduled",         color: "bg-sky-100 text-sky-700" },
  { value: "in_progress",         label: "In Progress",       color: "bg-amber-100 text-amber-700" },
  { value: "complete",            label: "Complete",          color: "bg-emerald-100 text-emerald-700" },
  { value: "invoiced",            label: "Invoiced",          color: "bg-blue-100 text-blue-700" },
  { value: "closed",              label: "Closed",            color: "bg-slate-100 text-slate-500" },
  { value: "disputed",            label: "Disputed",          color: "bg-red-100 text-red-700" },
]

interface Props {
  currentStatus: string
  onChangeStatus: (status: string) => void | Promise<void>
  type?: "task" | "job"
  saving?: boolean
}

export function StatusChangeDropdown({
  currentStatus,
  onChangeStatus,
  type = "task",
  saving,
}: Props) {
  const [open, setOpen] = useState(false)
  const statuses = type === "job" ? JOB_STATUSES : TASK_STATUSES
  const current = statuses.find((s) => s.value === currentStatus) ?? statuses[0]

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all",
          current.color,
          "hover:opacity-80 disabled:opacity-50"
        )}
      >
        {saving ? (
          <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : null}
        {current.label}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 min-w-[180px]">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={async () => {
                  setOpen(false)
                  await onChangeStatus(s.value)
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    s.color.split(" ")[0]
                  )}
                />
                {s.label}
                {s.value === currentStatus && (
                  <Check className="w-3 h-3 text-[#2563EB] ml-auto" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
