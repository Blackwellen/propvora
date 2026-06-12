import { CheckCircle2, BarChart3 } from "lucide-react"

const profiles = [
  { name: "Buy-to-Let", abbr: "BTL", desc: "Single residential lettings", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { name: "HMO", abbr: "HMO", desc: "Houses of multiple occupation", color: "bg-violet-100 text-violet-700 border-violet-200" },
  { name: "Serviced Accom.", abbr: "SA", desc: "Short-term & holiday lets", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { name: "Rent-to-Rent", abbr: "R2R", desc: "Control without ownership", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { name: "Lease Option", abbr: "LO", desc: "Option to purchase later", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { name: "Co-living", abbr: "CO", desc: "Shared community spaces", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { name: "Student Let", abbr: "STU", desc: "Academic-year tenancies", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { name: "Commercial", abbr: "COM", desc: "Retail, office & industrial", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { name: "Mixed Use", abbr: "MU", desc: "Residential + commercial", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { name: "Development Exit", abbr: "DEV", desc: "New-build sell or hold", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { name: "BRRR", abbr: "BRRR", desc: "Buy, refurb, refinance, rent", color: "bg-rose-100 text-rose-700 border-rose-200" },
  { name: "Assisted Sale", abbr: "AS", desc: "Sell on behalf of owner", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { name: "Flip", abbr: "FLIP", desc: "Buy low, refurb, sell high", color: "bg-lime-100 text-lime-700 border-lime-200" },
]

const bullets = [
  "Gross yield, net yield & ROI calculations",
  "Breakeven analysis & cash flow projections",
  "Risk scoring with sensitivity analysis",
  "Landlord offer letter generator",
  "Side-by-side deal comparison",
]

export default function OperatingProfilesSection() {
  return (
    <section id="operating-profiles" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-violet-200">
              <BarChart3 className="h-3.5 w-3.5" />
              Planning Engine
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              13 operation profiles.{" "}
              <span className="text-violet-600">Every strategy covered.</span>
            </h2>

            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              The Propvora Planning Engine is the most comprehensive deal-modelling tool available for
              UK property operators. Pick your strategy, enter your numbers, and get a full financial
              model in seconds — with risk scoring built in.
            </p>

            <ul className="space-y-3 mb-8">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{b}</span>
                </li>
              ))}
            </ul>

            {/* Big stat */}
            <div className="flex gap-8 pt-6 border-t border-slate-100">
              <div>
                <div className="text-4xl font-bold text-violet-600">13</div>
                <div className="text-sm text-slate-500 mt-0.5">UK property strategies</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900">360°</div>
                <div className="text-sm text-slate-500 mt-0.5">financial modelling</div>
              </div>
            </div>
          </div>

          {/* Right: profile cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profiles.map((p) => (
              <div
                key={p.abbr}
                className={`rounded-xl border p-4 ${p.color} flex flex-col gap-1.5`}
              >
                <div className="text-xs font-bold tracking-wider uppercase opacity-70">
                  {p.abbr}
                </div>
                <div className="font-semibold text-sm leading-tight">{p.name}</div>
                <div className="text-xs opacity-70 leading-tight">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
