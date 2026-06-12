import Link from "next/link"
import {
  Building2,
  Wrench,
  Users,
  Wallet,
  CalendarDays,
  Brain,
  ArrowRight,
  LayoutGrid,
  Handshake,
  ReceiptText,
  ChevronRight,
} from "lucide-react"

const features = [
  {
    icon: Building2,
    title: "Property Management",
    desc: "Manage properties, buildings, and ownership details with ease.",
    colour: "#2563EB",
    bg: "#EFF6FF",
  },
  {
    icon: LayoutGrid,
    title: "Unit Management",
    desc: "Track unit details, availability, features, and unit-specific information.",
    colour: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: Users,
    title: "Tenancy Management",
    desc: "Manage tenants, leases, renewals, deposits, and important dates.",
    colour: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    icon: Wrench,
    title: "Work Management",
    desc: "Create, assign, and track maintenance, inspections, and operational jobs.",
    colour: "#F59E0B",
    bg: "#FFFBEB",
  },
  {
    icon: Handshake,
    title: "Supplier Management",
    desc: "Manage vendors, contracts, contacts, and service agreements.",
    colour: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Scheduling",
    desc: "Stay on top of inspections, tasks, renewals, and key deadlines.",
    colour: "#0EA5E9",
    bg: "#F0F9FF",
  },
  {
    icon: ReceiptText,
    title: "Invoicing & Payments",
    desc: "Generate invoices, track payments, reconcile rent, and monitor arrears.",
    colour: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: Brain,
    title: "AI Copilot",
    desc: "Get AI-powered insights, summaries, and answers to run operations faster.",
    colour: "#7C3AED",
    bg: "#F5F3FF",
  },
]

export default function ToolsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
          {/* Left sticky copy panel */}
          <div className="lg:col-span-1 lg:sticky lg:top-28">
            <p className="text-[13px] font-bold text-blue-600 uppercase tracking-widest mb-4">
              Platform overview
            </p>
            <h2 className="text-[38px] font-bold text-[#06122F] leading-tight mb-5">
              All the tools you need.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                One platform.
              </span>
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
              Propvora brings every part of your property operations together in a single,
              easy-to-use workspace. Stop switching between tools — everything connects.
            </p>
            <Link
              href="/features"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[14px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all"
            >
              Explore all features <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Mini feature count badge */}
            <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[13px] text-slate-500 mb-1">Modules included</p>
              <p className="text-[32px] font-black text-[#06122F]">8+</p>
              <p className="text-[12px] text-slate-400">core operational modules</p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white cursor-default"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: f.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.colour }} />
                </div>
                <div>
                  <h3 className="text-[13.5px] font-bold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-[12.5px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom see all features banner */}
        <div className="mt-14 rounded-2xl bg-gradient-to-r from-slate-900 to-[#06122F] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[17px] font-bold text-white mb-1">Ready to see everything?</p>
            <p className="text-[13.5px] text-slate-400">
              Explore the full feature set — every module, every capability.
            </p>
          </div>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all shrink-0"
          >
            See all features <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
