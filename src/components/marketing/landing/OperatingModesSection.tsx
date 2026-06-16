import { CalendarClock, Home, Users2, Building } from "lucide-react"

const MODES = [
  {
    icon: CalendarClock,
    name: "Serviced Accommodation",
    tag: "SA",
    diff: "Nightly calendars, channel sync, dynamic pricing, guest messaging and a direct-booking engine.",
    points: ["Booking engine & channels", "Guest experience tools", "Cleaning & turnover tasks"],
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Home,
    name: "Residential",
    tag: "AST",
    diff: "Tenancies, rent schedules, deposits, renewals and the compliance certs landlords must hold.",
    points: ["Rent & arrears tracking", "Deposit & renewal flows", "Gas/EPC/EICR compliance"],
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Users2,
    name: "HMO",
    tag: "Room-by-room",
    diff: "Room-level lettings, shared-area compliance, licensing and per-room rent and arrears.",
    points: ["Per-room tenancies", "HMO licence tracking", "Shared-area certificates"],
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: Building,
    name: "Commercial",
    tag: "Mixed-use",
    diff: "Commercial leases, service charges, mixed-use portfolios and longer lease lifecycles.",
    points: ["Commercial leases", "Service-charge handling", "Mixed-use portfolios"],
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
]

export default function OperatingModesSection() {
  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[44px] font-bold text-[#06122F] leading-tight mb-4">
            One platform, four operating modes
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Propvora adapts to how you actually operate — the workflows, fields and compliance
            change to match each model.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODES.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center`}
                  >
                    <Icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {m.tag}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-2">{m.name}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">{m.diff}</p>
                <ul className="space-y-2 mt-auto">
                  {m.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                      <span className={`mt-1 h-1.5 w-1.5 rounded-full ${m.color} bg-current flex-shrink-0`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
