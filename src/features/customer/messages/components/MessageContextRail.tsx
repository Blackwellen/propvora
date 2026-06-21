"use client"

import { CheckCircle2, Calendar, FileText, CalendarCheck, Headphones } from "lucide-react"
import { useCustomerToast } from "../../components/toast"

export default function MessageContextRail() {
  const { toast } = useCustomerToast()
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Linked booking</p>
        <p className="text-[12.5px] text-slate-400">Booking details will appear here when a booking is linked to this conversation.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Guest details</p>
        <p className="text-[12.5px] font-semibold text-slate-800 flex items-center gap-1.5">You <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></p>
        <p className="text-[11.5px] text-slate-400">See your profile for contact details</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Payment &amp; alerts</p>
        <p className="text-[12.5px] text-slate-400">Payment and cancellation details will appear here when a booking is linked.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2">Quick actions</p>
        <ul className="space-y-1">
          {[["View booking details", Calendar], ["Share check-in guide", FileText], ["Request early check-in", CalendarCheck], ["Contact support", Headphones]].map(([label, Icon]) => {
            const I = Icon as typeof Calendar
            return <li key={label as string}><button onClick={() => toast(`${label} — coming soon`, "info")} className="w-full flex items-center gap-2.5 py-1.5 text-[12px] text-slate-600 hover:text-slate-900"><I className="w-4 h-4 text-slate-400" /> {label as string}</button></li>
          })}
        </ul>
      </div>
    </div>
  )
}
