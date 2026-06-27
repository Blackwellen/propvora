import type { Metadata } from "next"
import Link from "next/link"
import { Check, Sparkles, Rocket, Building2, ShieldCheck, Wrench, Wallet, Users, Map, Bot, Store, CalendarCheck } from "lucide-react"
import PublicNav from "@/components/marketing/PublicNav"
import PublicFooter from "@/components/marketing/PublicFooter"

export const metadata: Metadata = {
  title: "Roadmap · Propvora",
  description:
    "Where Propvora is today and where it's heading. We ship the UK property-operations + compliance SaaS first, then stage planning, AI and the marketplace layers.",
  alternates: { canonical: "/roadmap" },
  robots: { index: true, follow: true },
}

type Item = { label: string; icon: typeof Check; done?: boolean }

const V1: Item[] = [
  { label: "Portfolio, properties, units & tenancies", icon: Building2, done: true },
  { label: "Work, maintenance & supplier coordination", icon: Wrench, done: true },
  { label: "Compliance & legal — HMO, possession, certificates, deposits", icon: ShieldCheck, done: true },
  { label: "Money basics — rent, arrears, invoices, expenses, owner statements", icon: Wallet, done: true },
  { label: "Tenant, landlord & supplier portals", icon: Users, done: true },
  { label: "Documents, messaging & secure evidence", icon: Check, done: true },
  { label: "Auth, onboarding, billing & platform admin", icon: Check, done: true },
]

const V15: Item[] = [
  { label: "Planning engine — HMO, R2R, serviced accommodation, student, BRRR, lease option, commercial", icon: Map },
  { label: "AI Copilot — assisted property operations", icon: Bot },
  { label: "Advanced compliance & reporting / portfolio intelligence", icon: ShieldCheck },
  { label: "Automations — preset recipes & approvals", icon: Sparkles },
  { label: "Direct‑booking on‑ramp & MTD‑aware exports (Xero/QuickBooks sync)", icon: CalendarCheck },
  { label: "White‑label / agency", icon: Building2 },
]

const V2: Item[] = [
  { label: "Property marketplace — stays, suppliers & services", icon: Store },
  { label: "Consumer / guest booking workspace", icon: Users },
  { label: "Independent supplier SaaS workspace", icon: Wrench },
  { label: "Emergency dispatch & escrow‑protected payments", icon: Wallet },
  { label: "Full automation canvas & integrations", icon: Sparkles },
  { label: "Multi‑country / global compliance packs", icon: Map },
]

function Stage({ tag, tone, title, blurb, items, icon: Icon }: { tag: string; tone: string; title: string; blurb: string; items: Item[]; icon: typeof Rocket }) {
  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-1.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${tone}`}><Icon className="w-3.5 h-3.5" />{tag}</span>
      </div>
      <h2 className="text-[22px] font-bold tracking-tight text-[#0B1B3F]">{title}</h2>
      <p className="mt-1.5 text-[14px] text-slate-500">{blurb}</p>
      <ul className="mt-5 space-y-2.5">
        {items.map((it) => {
          const ItIcon = it.icon
          return (
            <li key={it.label} className="flex items-start gap-3">
              <span className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${it.done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                {it.done ? <Check className="w-3.5 h-3.5" /> : <ItIcon className="w-3 h-3" />}
              </span>
              <span className="text-[14px] text-slate-700">{it.label}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main id="main-content" className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[12.5px] font-semibold"><Rocket className="w-3.5 h-3.5" /> Product roadmap</span>
          <h1 className="mt-4 text-[34px] sm:text-[40px] font-bold tracking-tight text-[#0B1B3F] leading-tight">Built for UK property operations — staged to grow with you</h1>
          <p className="mt-4 text-[16px] text-slate-500 leading-relaxed">
            We ship a focused, paid <strong>property‑operations + compliance</strong> platform first, then layer in planning, AI and a property marketplace as each is ready. Everything below the first stage is on the way — not vapourware, and never billed before it lands.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <Stage tag="LIVE · V1" tone="bg-emerald-50 text-emerald-700" icon={Rocket} title="Operations & compliance" blurb="Run your UK lettings/property operation in one place." items={V1} />
          <Stage tag="NEXT · V1.5" tone="bg-blue-50 text-blue-700" icon={Sparkles} title="Planning, AI & premium" blurb="Strategy, intelligence and automation for growing operators." items={V15} />
          <Stage tag="LATER · V2" tone="bg-violet-50 text-violet-700" icon={Store} title="The property platform" blurb="Marketplace, consumer & supplier network — released on traction." items={V2} />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-14 text-center">
          <p className="text-[14px] text-slate-500">Want a say in what we build next?</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/register" className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1d4ed8] transition-colors">Get started</Link>
            <Link href="/contact" className="px-5 py-2.5 rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Talk to us</Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
