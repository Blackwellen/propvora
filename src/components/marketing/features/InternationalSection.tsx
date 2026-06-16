import { Globe2, CheckCircle2, Coins, Clock, Languages, Flag } from "lucide-react"

const bullets = [
  "Multi-currency money handling and reporting",
  "Timezone-aware scheduling, bookings and reminders",
  "Multi-language interface for cross-border teams",
  "Country packs for local legal, tax and compliance depth",
  "Operate a single portfolio across multiple markets",
]

const capabilities = [
  { icon: Coins, title: "Multi-currency", desc: "Track and report in the currency of each market." },
  { icon: Clock, title: "Timezones", desc: "Schedules and bookings respect local time." },
  { icon: Languages, title: "Languages", desc: "Localised interface for international teams." },
  { icon: Flag, title: "Country packs", desc: "Local compliance and tax depth where you operate." },
]

export default function InternationalSection() {
  return (
    <section id="international" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-teal-200">
              <Globe2 className="h-3.5 w-3.5" />
              International
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              Run a portfolio{" "}
              <span className="text-teal-600">across borders</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Propvora is built for operators who don&apos;t stop at one market. Multi-currency,
              timezones, languages and country packs let you manage properties in different
              countries from one connected workspace.
            </p>
            <ul className="space-y-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capabilities.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.title}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{c.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
