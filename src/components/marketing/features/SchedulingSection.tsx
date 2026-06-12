import { CalendarDays, CheckCircle2 } from "lucide-react"

const bullets = [
  "Unified calendar across all properties",
  "Compliance and certification expiry tracking",
  "Tenancy milestone alerts",
  "iCal sync for Google and Outlook",
  "Team member scheduling & assignments",
]

// A static decorative mini-calendar for June 2026
const calendarDays: Array<{ day: number; events: Array<{ type: "gas" | "tenancy" | "inspection" | "rent" }> }> = [
  { day: 1, events: [] },
  { day: 2, events: [] },
  { day: 3, events: [{ type: "inspection" }] },
  { day: 4, events: [] },
  { day: 5, events: [] },
  { day: 6, events: [] },
  { day: 7, events: [{ type: "tenancy" }] },
  { day: 8, events: [] },
  { day: 9, events: [] },
  { day: 10, events: [{ type: "gas" }] },
  { day: 11, events: [] },
  { day: 12, events: [{ type: "rent" }] },
  { day: 13, events: [] },
  { day: 14, events: [] },
  { day: 15, events: [{ type: "inspection" }] },
  { day: 16, events: [] },
  { day: 17, events: [{ type: "tenancy" }] },
  { day: 18, events: [] },
  { day: 19, events: [] },
  { day: 20, events: [{ type: "gas" }, { type: "rent" }] },
  { day: 21, events: [] },
  { day: 22, events: [{ type: "gas" }] },
  { day: 23, events: [] },
  { day: 24, events: [{ type: "tenancy" }] },
  { day: 25, events: [] },
  { day: 26, events: [{ type: "inspection" }] },
  { day: 27, events: [] },
  { day: 28, events: [] },
  { day: 29, events: [{ type: "rent" }] },
  { day: 30, events: [] },
]

const eventDotColors = {
  gas: "bg-red-400",
  tenancy: "bg-blue-400",
  inspection: "bg-amber-400",
  rent: "bg-purple-400",
}

const upcomingEvents = [
  {
    date: "10 Jun",
    label: "Gas Safety Renewal",
    address: "4 Oak Close",
    type: "gas" as const,
    badge: "bg-red-100 text-red-700",
  },
  {
    date: "14 Jun",
    label: "Tenancy Review",
    address: "Unit 5A, Riverview",
    type: "tenancy" as const,
    badge: "bg-blue-100 text-blue-700",
  },
  {
    date: "20 Jun",
    label: "Inspection Scheduled",
    address: "22 Cedar Avenue",
    type: "inspection" as const,
    badge: "bg-amber-100 text-amber-700",
  },
  {
    date: "29 Jun",
    label: "Rent Review Due",
    address: "8 Park Lane",
    type: "rent" as const,
    badge: "bg-purple-100 text-purple-700",
  },
]

const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"]

export default function SchedulingSection() {
  return (
    <section id="scheduling" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-teal-200">
              <CalendarDays className="h-3.5 w-3.5" />
              Operational Calendar
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Never miss a date{" "}
              <span className="text-teal-600">that matters</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Property operations are deadline-driven. Gas certs, tenancy ends, EPC expiries, rent
              reviews — missing any of them has consequences. Propvora surfaces everything that
              matters, exactly when it matters.
            </p>

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
              {[
                { color: "bg-red-400", label: "Gas safety" },
                { color: "bg-blue-400", label: "Tenancy" },
                { color: "bg-amber-400", label: "Inspection" },
                { color: "bg-purple-400", label: "Rent review" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5 text-sm text-slate-600">
                  <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: calendar + events */}
          <div className="space-y-4">
            {/* Mini calendar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">June 2026</span>
                <CalendarDays className="h-4 w-4 text-teal-500" />
              </div>
              <div className="px-5 py-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {daysOfWeek.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-slate-400">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days grid — June 2026 starts on Monday */}
                <div className="grid grid-cols-7 gap-y-1">
                  {calendarDays.map(({ day, events }) => (
                    <div
                      key={day}
                      className="aspect-square flex flex-col items-center justify-center gap-0.5 rounded-md hover:bg-slate-50"
                    >
                      <span className="text-xs text-slate-700">{day}</span>
                      <div className="flex gap-0.5">
                        {events.slice(0, 2).map((ev, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${eventDotColors[ev.type]}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming events list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-800">Upcoming Events</span>
              </div>
              <div className="divide-y divide-slate-100">
                {upcomingEvents.map((ev) => (
                  <div key={ev.label + ev.address} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="w-12 text-center">
                      <div className="text-xs font-bold text-slate-800">{ev.date}</div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${eventDotColors[ev.type]} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{ev.label}</div>
                      <div className="text-xs text-slate-500">{ev.address}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ev.badge} shrink-0`}>
                      {ev.label.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
