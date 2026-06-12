import Link from "next/link"
import Image from "next/image"
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  CalendarDays,
  Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden bg-white">
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #DBEAFE 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #BAE6FD 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[13px] font-semibold text-blue-700">
                All-in-One Property Management Platform
              </span>
            </div>

            <h1 className="text-[48px] sm:text-[56px] font-bold text-[#06122F] leading-tight tracking-tight mb-6">
              Run your property
              <br />
              operations.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Smarter.
              </span>
            </h1>

            <p className="text-[16px] text-slate-600 leading-relaxed max-w-lg mb-8">
              Propvora helps property managers replace spreadsheets, scattered tools, and manual
              admin with one connected workspace for properties, units, tenants, suppliers, work,
              invoices, payments, and AI-powered operations.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14.5px] text-white transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #1d4ed8)",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
                }}
              >
                Start Your Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14.5px] text-slate-700 border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Book a Demo
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {["No credit card required", "Setup in minutes", "Cancel anytime"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[12.5px] text-slate-500">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative hidden lg:block">
            {/* Main dashboard card */}
            <div
              className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white"
              style={{
                transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
                boxShadow:
                  "0 40px 100px rgba(0,0,0,0.14), 0 0 0 1px rgba(226,232,240,0.6)",
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[11px] text-slate-400 border border-slate-200">
                  app.propvora.com/dashboard
                </div>
              </div>

              {/* Dashboard content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-32 bg-[#06122F] flex flex-col py-3 shrink-0">
                  <div className="flex items-center px-3 py-2 mb-2">
                    <Image
                      src="/propvora-logo-dark.png"
                      alt="Propvora"
                      width={480}
                      height={120}
                      className="h-5 w-auto brightness-0 invert"
                    />
                  </div>
                  {[
                    "Dashboard",
                    "Properties",
                    "Units",
                    "Tenancies",
                    "Work Management",
                    "Suppliers",
                    "Calendar",
                    "Invoices",
                    "Payments",
                    "Documents",
                    "AI Copilot",
                    "Settings",
                  ].map((item, i) => (
                    <div
                      key={item}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg cursor-pointer",
                        i === 0 ? "bg-blue-600 text-white" : "text-white/50"
                      )}
                    >
                      <div className="w-2.5 h-2.5 rounded-sm bg-current opacity-60" />
                      <span className="text-[9px] font-medium truncate">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 bg-white p-4">
                  <p className="text-[13px] font-bold text-slate-900 mb-3">Dashboard</p>
                  {/* KPI row */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: "Properties", value: "128" },
                      { label: "Units", value: "1,248" },
                      { label: "Tenancies", value: "1,032" },
                      { label: "Open Work Orders", value: "86" },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="bg-slate-50 rounded-xl p-2.5 border border-slate-100"
                      >
                        <p className="text-[9px] text-slate-400 mb-0.5">{kpi.label}</p>
                        <p className="text-[14px] font-bold text-slate-900">{kpi.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Two col content */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Work Orders widget */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9.5px] font-bold text-slate-700 mb-2">Work Orders</p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full shrink-0"
                          style={{
                            background:
                              "conic-gradient(#2563EB 0deg 120deg, #10B981 120deg 200deg, #F59E0B 200deg 250deg, #10B981 250deg 360deg)",
                          }}
                        />
                        <div className="space-y-1">
                          {[
                            { label: "Open", v: "86", c: "#2563EB" },
                            { label: "In Progress", v: "42", c: "#10B981" },
                            { label: "On Hold", v: "12", c: "#F59E0B" },
                          ].map((s) => (
                            <div key={s.label} className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: s.c }}
                              />
                              <span className="text-[8.5px] text-slate-500">{s.label}</span>
                              <span className="text-[8.5px] font-bold text-slate-700 ml-1">
                                {s.v}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9.5px] font-bold text-slate-700 mb-2">
                        Upcoming Tasks
                      </p>
                      {[
                        {
                          name: "Routine inspection – Unit 12B",
                          due: "Due in 2 days",
                          sev: "High",
                          c: "#EF4444",
                        },
                        {
                          name: "Lease renewal – Unit 5A",
                          due: "Due in 5 days",
                          sev: "Medium",
                          c: "#F59E0B",
                        },
                        {
                          name: "AC Repair – Unit 3C",
                          due: "Due in 7 days",
                          sev: "Medium",
                          c: "#F59E0B",
                        },
                      ].map((t) => (
                        <div
                          key={t.name}
                          className="flex items-start justify-between py-1 border-b border-slate-100 last:border-0"
                        >
                          <div>
                            <p className="text-[8.5px] font-semibold text-slate-800 leading-tight">
                              {t.name}
                            </p>
                            <p className="text-[7.5px] text-slate-400">{t.due}</p>
                          </div>
                          <span
                            className="text-[7.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1"
                            style={{ background: t.c + "20", color: t.c }}
                          >
                            {t.sev}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9.5px] font-bold text-slate-700 mb-2">
                        Recent Payments
                      </p>
                      {[
                        { name: "Rent – Unit 5A", amt: "£1,950.00", status: "Paid" },
                        { name: "Rent – Unit 12B", amt: "£2,200.00", status: "Paid" },
                        { name: "Rent – Unit 3C", amt: "£1,800.00", status: "Pending" },
                      ].map((p) => (
                        <div
                          key={p.name}
                          className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0"
                        >
                          <p className="text-[8.5px] text-slate-600">{p.name}</p>
                          <div className="text-right">
                            <p className="text-[8.5px] font-bold text-slate-800">{p.amt}</p>
                            <p
                              className={cn(
                                "text-[7.5px] font-semibold",
                                p.status === "Paid" ? "text-emerald-500" : "text-amber-500"
                              )}
                            >
                              {p.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Portfolio Overview chart placeholder */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-[9.5px] font-bold text-slate-700 mb-2">
                        Portfolio Overview
                      </p>
                      <div className="h-14 flex items-end gap-0.5">
                        {[30, 45, 35, 55, 48, 65, 60, 72, 58, 80, 70, 85].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: `${h}%`,
                              background: i === 11 ? "#2563EB" : "#DBEAFE",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Copilot floating card */}
            <div
              className="absolute -right-8 top-8 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-52"
              style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <p className="text-[12px] font-bold text-slate-900">AI Copilot</p>
                <span className="text-[9.5px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full ml-auto">
                  BETA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Ask anything about your properties or operations.
              </p>
              <div className="w-full h-7 rounded-lg bg-blue-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1">
                Ask AI Copilot <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Occupancy Rate floating card */}
            <div
              className="absolute -right-6 bottom-32 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-44"
              style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Occupancy Rate
              </p>
              <p className="text-[28px] font-bold text-slate-900">92%</p>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "92%" }} />
              </div>
              <p className="text-[11px] text-emerald-500 font-semibold mt-1.5">
                +5% from last month
              </p>
            </div>

            {/* Monthly Revenue floating card */}
            <div
              className="absolute -left-6 bottom-16 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-44"
              style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Monthly Revenue
              </p>
              <p className="text-[22px] font-bold text-slate-900">£48,390</p>
              <p className="text-[11px] text-emerald-500 font-semibold mt-0.5">
                +12.5% from last month
              </p>
              <div className="mt-2 h-8">
                <svg viewBox="0 0 80 30" className="w-full h-full">
                  <polyline
                    points="0,25 15,20 30,22 45,12 60,15 80,5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operation models strip — honest, no fabricated logos */}
      <div className="relative max-w-7xl mx-auto px-6 pb-16 w-full">
        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide text-center mb-6">
          Built for every property operation model
        </p>
        <div className="flex items-center justify-center gap-x-10 gap-y-3 flex-wrap">
          {[
            "Long-term lets",
            "HMOs",
            "Rent-to-rent",
            "Serviced accommodation",
            "Student lets",
            "Mixed portfolios",
          ].map((model) => (
            <span key={model} className="text-[13px] font-semibold text-slate-400">
              {model}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
