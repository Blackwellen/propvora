import { LayoutGrid, TrendingUp, Zap, Shield, X, CheckCircle2 } from "lucide-react"

const benefits = [
  {
    icon: LayoutGrid,
    title: "Centralised Operations",
    desc: "Everything in one place — no more switching between tools or spreadsheets.",
    colour: "#60A5FA",
    bg: "rgba(37,99,235,0.15)",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Visibility",
    desc: "Get real-time insight into your properties, work, payments, tasks, and team performance.",
    colour: "#34D399",
    bg: "rgba(16,185,129,0.15)",
  },
  {
    icon: Zap,
    title: "Automate & Save Time",
    desc: "Automate reminders, reduce manual admin, and focus on what matters most.",
    colour: "#C084FC",
    bg: "rgba(124,58,237,0.15)",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security, audit trails, permissions, and reliable cloud infrastructure.",
    colour: "#FCD34D",
    bg: "rgba(245,158,11,0.15)",
  },
]

const comparisons = [
  {
    before: "Scattered spreadsheets",
    after: "Unified workspace",
  },
  {
    before: "Missed compliance dates",
    after: "Auto alerts & reminders",
  },
  {
    before: "Email job tracking",
    after: "Structured work hub",
  },
  {
    before: "Manual rent chasing",
    after: "Arrears dashboard",
  },
  {
    before: "Multiple tool subscriptions",
    after: "One flat monthly fee",
  },
]

export default function WhyTeamsSection() {
  return (
    <section className="py-24 bg-[#06122F]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-[13px] font-bold text-blue-400 uppercase tracking-widest mb-3">
            The Propvora difference
          </p>
          <h2 className="text-[40px] sm:text-[48px] font-bold text-white leading-tight">
            Why teams choose Propvora
          </h2>
          <p className="text-[15px] text-slate-400 mt-4 max-w-xl mx-auto leading-relaxed">
            Built from the ground up for property management teams who are done with
            cobbled-together workflows.
          </p>
        </div>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="flex flex-col p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shrink-0"
                style={{ background: item.bg }}
              >
                <item.icon className="w-6 h-6" style={{ color: item.colour }} />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">{item.title}</h3>
              <p className="text-[13.5px] text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Before / After comparison panel */}
        <div className="rounded-3xl overflow-hidden border border-white/10">
          {/* Panel header */}
          <div className="grid grid-cols-2">
            <div className="bg-red-950/60 border-b border-r border-white/10 px-8 py-5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <X className="w-3.5 h-3.5 text-red-400" />
              </div>
              <p className="text-[14px] font-bold text-red-300 uppercase tracking-wider">
                Before Propvora
              </p>
            </div>
            <div className="bg-emerald-950/60 border-b border-white/10 px-8 py-5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[14px] font-bold text-emerald-300 uppercase tracking-wider">
                After Propvora
              </p>
            </div>
          </div>

          {/* Comparison rows */}
          {comparisons.map((row, i) => (
            <div
              key={row.before}
              className={`grid grid-cols-2 ${i < comparisons.length - 1 ? "border-b border-white/8" : ""}`}
            >
              {/* Before */}
              <div className="px-8 py-5 border-r border-white/8 flex items-center gap-3 bg-red-950/20">
                <X className="w-4 h-4 text-red-500/70 shrink-0" />
                <span className="text-[14px] text-red-300/80">{row.before}</span>
              </div>
              {/* After */}
              <div className="px-8 py-5 flex items-center gap-3 bg-emerald-950/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[14px] font-semibold text-emerald-300">{row.after}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
