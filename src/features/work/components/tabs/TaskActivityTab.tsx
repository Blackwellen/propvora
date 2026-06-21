import React from "react"

interface ActivityItem {
  id: string
  type: string
  text: string
  user: string
  time: string
  initials: string
}

interface TaskActivityTabProps {
  activity: ActivityItem[]
}

export function TaskActivityTab({ activity }: TaskActivityTabProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity Timeline</h3>
      <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
        {activity.map((item) => (
          <div key={item.id} className="relative">
            <div className="absolute -left-6 w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {item.initials}
                </div>
                <p className="text-xs font-semibold text-slate-700">{item.user}</p>
                <p className="text-[10px] text-slate-400">{item.time}</p>
              </div>
              <p className="text-xs text-slate-600">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
