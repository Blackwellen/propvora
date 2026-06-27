import React from "react"

interface ActivityItem {
  id: string
  text: string
  user: string
  time: string
  initials: string
}

interface TaskRecentActivityFooterProps {
  activity: ActivityItem[]
}

export function TaskRecentActivityFooter({ activity }: TaskRecentActivityFooterProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
      <div className="flex gap-4 overflow-x-auto">
        {activity.map((item) => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-3 min-w-[200px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[var(--brand)] text-white text-[9px] font-bold flex items-center justify-center">
                {item.initials}
              </div>
              <p className="text-xs font-semibold text-slate-700">{item.user}</p>
            </div>
            <p className="text-xs text-slate-600">{item.text}</p>
            <p className="text-[10px] text-slate-400 mt-1">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
