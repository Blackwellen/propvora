import {
  Building2,
  CalendarCheck,
  Store,
  ShieldCheck,
  Receipt,
  Workflow,
  Brain,
  Globe2,
  Users,
} from "lucide-react"

const FEATURES = [
  {
    icon: Building2,
    title: "Portfolio & Tenancy",
    desc: "Properties, units, tenancies, rent schedules and documents in one structured workspace.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: CalendarCheck,
    title: "Bookings & Guest Experience",
    desc: "An Airbnb-grade booking engine for serviced accommodation — calendars, channels and guest comms.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: Store,
    title: "Supplier Marketplace",
    desc: "Find verified contractors by trade and location, invite them to jobs and track performance.",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Certs",
    desc: "Gas, electrical, EPC, fire and HMO certificates tracked with renewal reminders before they lapse.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Receipt,
    title: "Finance & Invoicing",
    desc: "Rent tracking, invoices, expenses, payments and money accounting built for property.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: Workflow,
    title: "Automations",
    desc: "A smart automations engine — triggers, conditions and actions that run your routine ops for you.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: Brain,
    title: "AI Copilot",
    desc: "Ask anything about your portfolio. Every AI-suggested action waits for your explicit approval.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    icon: Globe2,
    title: "Multi-currency & i18n",
    desc: "Currencies, timezones, languages and country packs so you can operate across borders.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-100",
  },
  {
    icon: Users,
    title: "Team & Workspace",
    desc: "Invite your team, assign roles and keep every workspace fully isolated and secure.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
]

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[44px] font-bold text-[#06122F] leading-tight mb-4">
            Everything you need to run property operations
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            One platform replaces the spreadsheets, inboxes and disconnected tools you use today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 bg-white p-7 hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-5`}
                >
                  <Icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
