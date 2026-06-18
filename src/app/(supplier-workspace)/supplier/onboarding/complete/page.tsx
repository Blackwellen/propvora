"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/onboarding/complete — onboarding complete (manifest image 66).

   Celebratory completion: 100% setup, profile / trust / services / coverage
   stats, the onboarding checklist, quick-start actions, "get your first job"
   and a marketplace visibility toggle. "Go to marketplace" links to the public
   listing preview. Visibility toggle is a typed stub (audit TODO).
─────────────────────────────────────────────────────────────────────────── */

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2, Sparkles, Star, Wrench, MapPin, ArrowRight, Eye, Inbox, FileText, Users,
} from "lucide-react"
import { SupplierCard, SupplierButton } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"

export const dynamic = "force-dynamic"

const STATS = [
  { label: "Profile", value: "Excellent", icon: Star, tone: "emerald" as const },
  { label: "Trust badges", value: "3 active", icon: Sparkles, tone: "emerald" as const },
  { label: "Services live", value: "4", icon: Wrench, tone: "slate" as const },
  { label: "Coverage", value: "20 miles", icon: MapPin, tone: "slate" as const },
]

const CHECKLIST = [
  "Business profile completed",
  "Services & pricing added",
  "Coverage area set",
  "Verification submitted",
  "Payout account connected",
]

const QUICK_START = [
  { label: "Review incoming requests", href: "/supplier/requests", icon: Inbox },
  { label: "Polish your public listing", href: "/supplier/profile/preview", icon: Eye },
  { label: "Add featured work photos", href: "/supplier/profile", icon: FileText },
  { label: "Invite your team", href: "/supplier/account", icon: Users },
]

export default function SupplierOnboardingCompletePage() {
  const [visible, setVisible] = useState(true)

  return (
    <div className="space-y-5">
      <MobileTopBar title="Onboarding complete" subtitle="Welcome aboard" />

      {/* Hero */}
      <SupplierCard className="p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8" /></div>
        <h1 className="text-2xl font-bold text-slate-900">You&apos;re all set up! 🎉</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Your workspace is ready and your listing can go live on the Propvora marketplace.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-semibold"><Sparkles className="w-4 h-4" /> Setup 100% complete</div>
      </SupplierCard>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map((s) => (
          <SupplierCard key={s.label} className="p-4">
            <div className="flex items-center justify-between"><span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{s.label}</span><s.icon className="w-4 h-4 text-slate-400" /></div>
            <p className={`text-lg font-bold mt-1 ${s.tone === "emerald" ? "text-emerald-600" : "text-slate-900"}`}>{s.value}</p>
          </SupplierCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 items-start">
        {/* Checklist + quick start */}
        <div className="space-y-4 min-w-0">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Your onboarding checklist</h2>
            <ul className="space-y-2.5">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{c}</li>
              ))}
            </ul>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_START.map((q) => (
                <Link key={q.label} href={q.href} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                  <span className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><q.icon className="w-4 h-4" /></span>
                  <span className="text-sm font-medium text-slate-800">{q.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 ml-auto shrink-0" />
                </Link>
              ))}
            </div>
          </SupplierCard>
        </div>

        {/* Get first job + visibility */}
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Marketplace visibility</h2>
                <p className="text-xs text-slate-400 mt-0.5">{visible ? "Your listing is live to customers" : "Hidden — you won't receive new requests"}</p>
              </div>
              <button
                onClick={() => setVisible((v) => !v)}
                role="switch"
                aria-checked={visible}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${visible ? "bg-emerald-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${visible ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </SupplierCard>

          <SupplierCard className="p-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center mb-3"><Sparkles className="w-6 h-6" /></div>
            <h2 className="text-base font-semibold text-slate-900">Get your first job</h2>
            <p className="text-sm text-slate-500 mt-1">See how ready you are to start receiving work.</p>
            <Link href="/supplier/onboarding/readiness" className="mt-4 block"><SupplierButton className="w-full justify-center">First-job readiness <ArrowRight className="w-4 h-4" /></SupplierButton></Link>
            <Link href="/supplier/profile/preview" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">Go to marketplace listing</Link>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}
