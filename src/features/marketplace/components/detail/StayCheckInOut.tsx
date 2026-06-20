import { Clock, LogOut } from "lucide-react"

interface StayCheckInOutProps {
  checkInWindow: string | null
  checkoutTime: string | null
}

export default function StayCheckInOut({ checkInWindow, checkoutTime }: StayCheckInOutProps) {
  if (!checkInWindow && !checkoutTime) return null

  return (
    <section className="py-7 border-b border-slate-200">
      <h2 className="text-[19px] font-bold text-[#0B1B3F] mb-4">Check-in &amp; check-out</h2>
      <div className="grid grid-cols-2 gap-4">
        {checkInWindow && (
          <div className="rounded-2xl border border-slate-200 px-5 py-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Clock className="w-3.5 h-3.5" /> Check-in
            </p>
            <p className="text-[18px] font-bold text-[#0B1B3F]">{checkInWindow}</p>
          </div>
        )}
        {checkoutTime && (
          <div className="rounded-2xl border border-slate-200 px-5 py-4">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <LogOut className="w-3.5 h-3.5" /> Check-out
            </p>
            <p className="text-[18px] font-bold text-[#0B1B3F]">{checkoutTime}</p>
          </div>
        )}
      </div>
    </section>
  )
}
