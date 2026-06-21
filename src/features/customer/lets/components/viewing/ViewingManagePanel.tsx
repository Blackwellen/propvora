"use client"

import { useState } from "react"
import { Bell, Calendar, RefreshCw, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomerToast } from "../../../components/toast"

export default function ViewingManagePanel() {
  const { toast } = useCustomerToast()
  const [remind, setRemind] = useState(true)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" /> Manage viewing
        </p>
        <button
          onClick={() => toast("Attendance confirmed", "success")}
          className="w-full bg-[#2563EB] text-white rounded-xl py-2.5 text-[13px] font-semibold mb-2"
        >
          Confirm attendance
        </button>
        <button
          onClick={() => toast("Reschedule — coming soon", "info")}
          className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 mb-2"
        >
          <RefreshCw className="w-4 h-4" /> Reschedule viewing
        </button>
        <button
          onClick={() => toast("Cancel viewing — coming soon", "info")}
          className="w-full inline-flex items-center justify-center gap-1.5 border border-rose-200 rounded-xl py-2 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50 mb-2"
        >
          <XCircle className="w-4 h-4" /> Cancel viewing
        </button>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-[12px] text-slate-600 inline-flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-slate-400" /> Reminders
          </span>
          <button
            onClick={() => setRemind(!remind)}
            className={cn("w-9 h-5 rounded-full p-0.5 transition", remind ? "bg-emerald-500" : "bg-slate-200")}
          >
            <span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", remind && "translate-x-4")} />
          </button>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
        <p className="text-[12.5px] font-semibold text-amber-700">Cancellation policy</p>
        <p className="text-[11.5px] text-slate-600 mt-1">
          Free to reschedule or cancel up to 4 hours before your viewing. After that, please message the agent directly.
        </p>
        <button
          onClick={() => toast("Opening policy…", "info")}
          className="mt-2 text-[12px] font-semibold text-amber-700"
        >
          View policy
        </button>
      </div>
    </div>
  )
}
