"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  Wrench,
  CalendarDays,
  FileText,
  PoundSterling,
  ShieldCheck,
  Brain,
  Settings,
  Search,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Bell,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

const AUDIENCES = [
  "for property managers",
  "for SA hosts",
  "for HMO landlords",
  "for portfolio investors",
  "for letting agencies",
]

const NAV = [
  {
    group: "Portfolio",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", active: false },
      { icon: Building2, label: "Properties", active: true },
      { icon: Layers, label: "Units", active: false },
      { icon: Users, label: "Tenants", active: false },
    ],
  },
  {
    group: "Operations",
    items: [
      { icon: Wrench, label: "Work Orders", active: false },
      { icon: CalendarDays, label: "Calendar", active: false },
    ],
  },
  {
    group: "Finance",
    items: [
      { icon: PoundSterling, label: "Invoices", active: false },
      { icon: FileText, label: "Documents", active: false },
    ],
  },
  {
    group: "Platform",
    items: [
      { icon: ShieldCheck, label: "Compliance", active: false },
      { icon: Brain, label: "AI Copilot", active: false },
      { icon: Settings, label: "Settings", active: false },
    ],
  },
]

const KPIS = [
  { label: "Properties", value: "24", trend: "+2", up: true, icon: Building2, color: "#2563EB", bg: "#EFF6FF" },
  { label: "Units", value: "186", trend: "+8", up: true, icon: Layers, color: "#7C3AED", bg: "#F5F3FF" },
  { label: "Occupancy", value: "91.3%", trend: "+1.2%", up: true, icon: TrendingUp, color: "#059669", bg: "#ECFDF5" },
  { label: "Monthly Revenue", value: "£48,390", trend: "+12.5%", up: true, icon: PoundSterling, color: "#0369A1", bg: "#F0F9FF" },
]

const PROPERTIES = [
  {
    img: "/auth1.png",
    name: "Harbour View Apartments",
    address: "12 Marina Way, Manchester M1 2AB",
    units: 8,
    occupied: 8,
    rent: "£9,600",
    status: "Active",
    profile: "Long-let",
    profileColor: "#2563EB",
    occupancyPct: 100,
  },
  {
    img: "/auth2.png",
    name: "Greenfield Court",
    address: "4 Parkside Close, Leeds LS1 4BN",
    units: 6,
    occupied: 5,
    rent: "£7,200",
    status: "Active",
    profile: "HMO",
    profileColor: "#7C3AED",
    occupancyPct: 83,
  },
  {
    img: "/auth3.png",
    name: "The Pavilion SA",
    address: "28 Central Square, Birmingham B1 1TQ",
    units: 4,
    occupied: 4,
    rent: "£6,800",
    status: "Active",
    profile: "Serviced Acc.",
    profileColor: "#0369A1",
    occupancyPct: 100,
  },
]

export default function HeroSection() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % AUDIENCES.length), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden bg-white">
      <style>{`
        @keyframes propvoraHeroFade{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes propvoraFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes propvoraFloatAlt{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[700px] h-[700px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #DBEAFE 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #EDE9FE 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── LEFT: copy + CTAs ─────────────────────────────────── */}
          <div>
            <h1 className="text-[34px] sm:text-[48px] lg:text-[56px] font-bold text-[#06122F] leading-tight tracking-tight mb-3">
              Run your property
              <br />
              operations{" "}
              <span style={{
                background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                smarter.
              </span>
            </h1>

            <div className="h-8 mb-6" aria-live="polite">
              <p className="text-[18px] sm:text-[20px] font-semibold text-slate-500">
                One connected workspace{" "}
                <span
                  key={index}
                  className="inline-block text-blue-600"
                  style={{ animation: "propvoraHeroFade 0.5s ease" }}
                >
                  {AUDIENCES[index]}
                </span>
                .
              </p>
            </div>

            <p className="text-[16px] text-slate-600 leading-relaxed max-w-lg mb-8">
              Propvora helps property operators replace spreadsheets, scattered tools, and manual
              admin with one connected workspace — properties, units, tenants, suppliers, work,
              invoices, payments, and AI-powered operations.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:flex-wrap mb-8">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14.5px] text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #2563EB, #1d4ed8)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}
              >
                Start free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14.5px] text-slate-700 border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                See how it works
                <ArrowRight className="w-4 h-4 text-slate-400" />
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

          {/* ── RIGHT: premium app mockup ──────────────────────────── */}
          <div className="relative hidden lg:block">
            {/* Main browser frame */}
            <div
              className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white"
              style={{
                transform: "perspective(1400px) rotateY(-4deg) rotateX(2deg)",
                boxShadow: "0 48px 120px rgba(0,0,0,0.16), 0 0 0 1px rgba(226,232,240,0.5)",
              }}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-slate-400 border border-slate-200 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  app.propvora.com/portfolio/properties
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">JT</span>
                  </div>
                </div>
              </div>

              {/* App layout */}
              <div className="flex" style={{ height: 440 }}>

                {/* ── SIDEBAR ─────────────────────── */}
                <div className="w-[148px] bg-[#06122F] flex flex-col py-3 shrink-0 overflow-hidden">
                  {/* Logo */}
                  <div className="px-3 py-1.5 mb-3">
                    <Image src="/propvora-logo-dark.png" alt="Propvora" width={480} height={120} className="h-4 w-auto brightness-0 invert" />
                  </div>

                  {/* Workspace picker */}
                  <div className="mx-2 mb-3 px-2 py-1.5 rounded-lg bg-white/5 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-[7px] font-bold">P</span>
                    </div>
                    <span className="text-white/70 text-[8.5px] font-medium truncate flex-1">Propvora Demo</span>
                    <ChevronRight className="w-2.5 h-2.5 text-white/30 shrink-0" />
                  </div>

                  {/* Nav groups */}
                  <div className="flex-1 overflow-hidden space-y-3 px-2">
                    {NAV.map((group) => (
                      <div key={group.group}>
                        <p className="text-[7.5px] font-bold text-white/25 uppercase tracking-wider px-1.5 mb-1">{group.group}</p>
                        {group.items.map((item) => (
                          <div
                            key={item.label}
                            className={cn(
                              "flex items-center gap-1.5 px-1.5 py-1.5 rounded-md cursor-pointer transition-colors",
                              item.active ? "bg-blue-600 text-white" : "text-white/45 hover:text-white/70 hover:bg-white/5"
                            )}
                          >
                            <item.icon className="w-3 h-3 shrink-0" />
                            <span className="text-[9px] font-medium truncate">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── MAIN CONTENT ─────────────────── */}
                <div className="flex-1 bg-[#F8FAFC] overflow-hidden flex flex-col">

                  {/* Page header */}
                  <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-0.5">
                        <span>Portfolio</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                        <span className="text-slate-600 font-medium">Properties</span>
                      </div>
                      <p className="text-[13px] font-bold text-slate-900">Properties</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1 text-[9px] text-slate-500">
                        <Search className="w-2.5 h-2.5" />
                        Search…
                      </div>
                      <button className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                      </button>
                      <button className="flex items-center gap-1 bg-blue-600 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold">
                        <Plus className="w-2.5 h-2.5" />Add property
                      </button>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-hidden p-3 space-y-3">

                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-2">
                      {KPIS.map((kpi) => (
                        <div key={kpi.label} className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[8.5px] text-slate-400 font-medium">{kpi.label}</span>
                            <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                              <kpi.icon className="w-2.5 h-2.5" style={{ color: kpi.color }} />
                            </div>
                          </div>
                          <p className="text-[14px] font-black text-slate-900 leading-none mb-1">{kpi.value}</p>
                          <div className="flex items-center gap-0.5">
                            {kpi.up
                              ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                              : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
                            <span className={cn("text-[8px] font-bold", kpi.up ? "text-emerald-600" : "text-red-500")}>
                              {kpi.trend}
                            </span>
                            <span className="text-[8px] text-slate-400 ml-0.5">vs last month</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View toggle + count */}
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] text-slate-500 font-medium">24 properties · Page 1 of 2</p>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                        <button className="px-2 py-1 bg-slate-900">
                          <LayoutGrid className="w-3 h-3 text-white" />
                        </button>
                        <button className="px-2 py-1 border-l border-slate-200">
                          <FileText className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Property cards grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {PROPERTIES.map((p) => (
                        <div key={p.name} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer group">
                          {/* Cover image */}
                          <div className="relative h-[68px] overflow-hidden">
                            <Image
                              src={p.img}
                              alt={p.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="160px"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(6,18,47,0.5) 0%, transparent 60%)" }} />
                            {/* Badges */}
                            <div className="absolute top-1.5 left-1.5 flex gap-1">
                              <span
                                className="text-[7px] font-bold px-1.5 py-0.5 rounded-full text-white"
                                style={{ background: p.profileColor }}
                              >
                                {p.profile}
                              </span>
                            </div>
                            <div className="absolute top-1.5 right-1.5">
                              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                                Active
                              </span>
                            </div>
                            {/* Revenue on image */}
                            <div className="absolute bottom-1.5 left-1.5">
                              <p className="text-[10px] font-black text-white">{p.rent}<span className="text-[7px] font-normal opacity-70">/mo</span></p>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="p-2">
                            <p className="text-[9px] font-bold text-slate-900 leading-tight truncate mb-0.5">{p.name}</p>
                            <p className="text-[8px] text-slate-400 truncate mb-2">{p.address}</p>

                            {/* Stats row */}
                            <div className="flex items-center justify-between text-[7.5px]">
                              <span className="text-slate-500">{p.units} units</span>
                              <span className="text-slate-500">{p.occupied}/{p.units} let</span>
                            </div>

                            {/* Occupancy bar */}
                            <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${p.occupancyPct}%`,
                                  background: p.occupancyPct === 100 ? "#10B981" : p.occupancyPct >= 80 ? "#2563EB" : "#F59E0B"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* ── FLOATING CARDS ─────────────────────────────────── */}

            {/* AI Copilot card */}
            <div
              className="absolute -right-6 top-6 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-52"
              style={{ boxShadow: "0 20px 48px rgba(0,0,0,0.12)", animation: "propvoraFloat 4s ease-in-out infinite" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[12px] font-bold text-slate-900">AI Copilot</p>
                <span className="text-[8px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full ml-auto">PRO</span>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-relaxed mb-2.5">
                "Summarise rent arrears across HMO properties this quarter."
              </p>
              <div className="flex items-center gap-1.5 p-2 bg-violet-50 rounded-xl border border-violet-100">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[9.5px] font-semibold text-violet-700">Generating report…</span>
              </div>
            </div>

            {/* Revenue card */}
            <div
              className="absolute -right-4 bottom-28 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-44"
              style={{ boxShadow: "0 20px 48px rgba(0,0,0,0.12)", animation: "propvoraFloatAlt 5s ease-in-out infinite" }}
            >
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Monthly Revenue</p>
              <p className="text-[22px] font-black text-slate-900 leading-none mb-1">£48,390</p>
              <div className="flex items-center gap-1 mb-2.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">+12.5% vs last month</span>
              </div>
              <svg viewBox="0 0 80 28" className="w-full h-7">
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,24 L13,19 L26,21 L39,12 L52,14 L65,6 L80,3 L80,28 L0,28 Z" fill="url(#rg)" />
                <polyline points="0,24 13,19 26,21 39,12 52,14 65,6 80,3" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="80" cy="3" r="2.5" fill="#10B981" />
              </svg>
            </div>

            {/* Occupancy card */}
            <div
              className="absolute -left-5 bottom-12 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 w-44"
              style={{ boxShadow: "0 20px 48px rgba(0,0,0,0.12)", animation: "propvoraFloat 6s ease-in-out infinite 1s" }}
            >
              <p className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Occupancy Rate</p>
              <p className="text-[28px] font-black text-slate-900 leading-none">92%</p>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 mb-1 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }} />
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">+5% from last month</p>
            </div>

          </div>
        </div>
      </div>

      {/* Operation models strip */}
      <div className="relative max-w-7xl mx-auto px-6 pb-14 w-full">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide text-center mb-5">
          Built for every property operation model
        </p>
        <div className="flex items-center justify-center gap-x-10 gap-y-3 flex-wrap">
          {["Long-term lets", "HMOs", "Rent-to-rent", "Serviced accommodation", "Student lets", "Mixed portfolios"].map((model) => (
            <span key={model} className="text-[12.5px] font-semibold text-slate-400">{model}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
