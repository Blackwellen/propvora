import { CalendarCheck, CheckCircle2, Globe, MessageSquare, KeyRound } from "lucide-react"

const bullets = [
  "Direct-booking pages with your own branding",
  "Availability calendar and channel sync to avoid double bookings",
  "Guest messaging, check-in details and house rules",
  "Cancellation, damage-deposit and house-rules policies built in",
  "Turnover and cleaning tasks created automatically on checkout",
]

const calendar = [
  { day: "Mon", state: "booked" },
  { day: "Tue", state: "booked" },
  { day: "Wed", state: "free" },
  { day: "Thu", state: "free" },
  { day: "Fri", state: "booked" },
  { day: "Sat", state: "booked" },
  { day: "Sun", state: "pending" },
]

const stateStyle: Record<string, string> = {
  booked: "bg-rose-100 border-rose-200 text-rose-700",
  free: "bg-slate-50 border-slate-200 text-slate-400",
  pending: "bg-amber-100 border-amber-200 text-amber-700",
}

export default function BookingEngineSection() {
  return (
    <section id="booking-engine" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-rose-200">
              <CalendarCheck className="h-3.5 w-3.5" />
              Booking Engine
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              An Airbnb-grade{" "}
              <span className="text-rose-600">booking engine</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Take direct bookings for your serviced accommodation with branded booking pages,
              synced calendars and a full guest experience — without paying platform commissions on
              every stay.
            </p>
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <p className="text-sm font-bold text-slate-900 mb-4">Availability — this week</p>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {calendar.map((c) => (
                <div
                  key={c.day}
                  className={`rounded-lg border text-center py-3 ${stateStyle[c.state]}`}
                >
                  <div className="text-[10px] font-semibold uppercase">{c.day}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Globe, label: "Channel sync" },
                { icon: MessageSquare, label: "Guest comms" },
                { icon: KeyRound, label: "Check-in info" },
              ].map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.label}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center"
                  >
                    <Icon className="h-5 w-5 text-rose-600 mx-auto mb-1.5" />
                    <div className="text-[11px] font-medium text-slate-600">{f.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
