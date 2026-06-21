import { Rocket, Wallet, TrendingUp, Shield, Users, Activity, Clock, CheckCircle2 } from "lucide-react"

const statCards = [
  {
    icon: Rocket,
    stat: "< 10 min",
    label: "setup",
    title: "Launch Fast",
    desc: "Get up and running in minutes, not months. No complex onboarding — import your data and go.",
    colour: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#2563EB",
  },
  {
    icon: Wallet,
    stat: "5+ tools",
    label: "replaced",
    title: "Save More",
    desc: "Replace spreadsheets, job trackers, rent chasers, and more — one flat monthly fee instead of many.",
    colour: "#10B981",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    accent: "#10B981",
  },
  {
    icon: TrendingUp,
    stat: "1 → ∞",
    label: "properties",
    title: "Scale Effortlessly",
    desc: "Start with a single property. Grow to thousands. Propvora scales with your portfolio without friction.",
    colour: "#7C3AED",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    accent: "#7C3AED",
  },
  {
    icon: Shield,
    stat: "100%",
    label: "audit ready",
    title: "Stay Compliant",
    desc: "Built-in compliance workflows, inspection tracking, and audit-ready records out of the box.",
    colour: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FDE68A",
    accent: "#F59E0B",
  },
]

const statsStrip = [
  { icon: Users, value: "1,200+", label: "operators" },
  { icon: Activity, value: "98%", label: "uptime" },
  { icon: Clock, value: "14-day", label: "free trial" },
  { icon: CheckCircle2, value: "Minutes", label: "to set up" },
]

export default function BuiltForSection() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-[13px] font-bold text-blue-600 uppercase tracking-widest mb-3">
            Why operators choose Propvora
          </p>
          <h2 className="text-[38px] sm:text-[44px] font-bold text-[#06122F] leading-tight mb-4">
            Built for startups.{" "}
            <span className="relative inline-block">
              Designed to scale.
              <span
                className="absolute -bottom-1 left-0 right-0 h-1 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--brand), var(--color-sky-500, #0EA5E9))" }}
              />
            </span>
          </h2>
          <p className="text-[15px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            Whether you manage 2 properties or 2,000, Propvora gives you the infrastructure to run
            operations professionally from day one.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="relative flex flex-col p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all overflow-hidden"
              style={{ borderLeft: `4px solid ${card.accent}` }}
            >
              {/* Large stat top */}
              <div className="mb-4">
                <span
                  className="text-[32px] font-black leading-none tracking-tight"
                  style={{ color: card.colour }}
                >
                  {card.stat}
                </span>
                <span className="text-[13px] font-semibold text-slate-400 ml-2">{card.label}</span>
              </div>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0"
                style={{ background: card.bg }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.colour }} />
              </div>

              <h3 className="text-[16px] font-bold text-slate-900 mb-2">{card.title}</h3>
              <p className="text-[13.5px] text-slate-500 leading-relaxed">{card.desc}</p>

              {/* Subtle background watermark */}
              <div
                className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5"
                style={{ background: card.colour }}
              />
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100">
            {statsStrip.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center py-8 px-6 text-center"
              >
                <stat.icon className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-[28px] font-black text-[#06122F] leading-none mb-1">
                  {stat.value}
                </span>
                <span className="text-[12.5px] font-semibold text-slate-400 uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
