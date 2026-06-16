import { BadgeCheck, ShieldCheck, Zap, Lock, Star, CalendarRange } from "lucide-react"

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Verified badge",
    desc: "Get verified and stand out. Operators trust suppliers with confirmed ID and business details.",
  },
  {
    icon: ShieldCheck,
    title: "Insurance check",
    desc: "Upload your public liability cover once and display your insured status to every operator.",
  },
  {
    icon: Zap,
    title: "Instant quotes",
    desc: "Respond to job invitations and send quotes in minutes, directly from your workspace.",
  },
  {
    icon: Lock,
    title: "Payment protection",
    desc: "Invoices and payments are handled through the platform, so you know where every job stands.",
  },
  {
    icon: Star,
    title: "Build your reputation",
    desc: "Earn reviews tied to real completed jobs and grow a profile that wins you more work.",
  },
  {
    icon: CalendarRange,
    title: "Manage availability",
    desc: "Set your coverage areas and availability so you only get matched to jobs you can take.",
  },
]

export default function SupplierBenefits() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-[#06122F] leading-tight mb-3">
            Why suppliers choose Propvora
          </h2>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Everything you need to win work and get paid, without the admin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => {
            const Icon = b.icon
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-slate-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-[17px] font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
