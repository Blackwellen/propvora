"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/onboarding/readiness — first-job readiness checklist (manifest 67).

   An overall readiness %, scored categories (availability, services, pricing,
   coverage, compliance, payment setup, message response, evidence quality, job
   ratings) each with status + a fix-it action, a "what's missing" panel, and a
   "Start receiving jobs" CTA gated on readiness. Toggling visibility is a typed
   stub (audit TODO).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarDays, Wrench, PoundSterling, MapPin, ShieldCheck, CreditCard,
  MessagesSquare, Images, Star, CheckCircle2, AlertTriangle, ArrowRight, Play,
} from "lucide-react"
import { SupplierCard, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"

export const dynamic = "force-dynamic"

type Status = "complete" | "action" | "optional"

interface Category {
  key: string
  label: string
  icon: typeof Wrench
  status: Status
  detail: string
  href: string
  actionLabel: string
}

const CATEGORIES: Category[] = [
  { key: "availability", label: "Availability", icon: CalendarDays, status: "complete", detail: "Working hours set for 5 days/week.", href: "/supplier/schedule", actionLabel: "Edit hours" },
  { key: "services", label: "Services", icon: Wrench, status: "complete", detail: "4 services published.", href: "/supplier/services", actionLabel: "Manage services" },
  { key: "pricing", label: "Pricing", icon: PoundSterling, status: "complete", detail: "Call-out and hourly rates set.", href: "/supplier/services", actionLabel: "Review pricing" },
  { key: "coverage", label: "Coverage", icon: MapPin, status: "complete", detail: "20-mile radius from base.", href: "/supplier/coverage", actionLabel: "Edit coverage" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, status: "action", detail: "Insurance certificate expired — renew to stay eligible.", href: "/supplier/insurance/renew?step=policy", actionLabel: "Renew insurance" },
  { key: "payment", label: "Payment setup", icon: CreditCard, status: "complete", detail: "Payout account connected.", href: "/supplier/finance", actionLabel: "View payouts" },
  { key: "response", label: "Message response", icon: MessagesSquare, status: "optional", detail: "Set a quick-reply template for faster responses.", href: "/supplier/inbox", actionLabel: "Set templates" },
  { key: "evidence", label: "Evidence quality", icon: Images, status: "optional", detail: "Add featured work photos to boost trust.", href: "/supplier/profile", actionLabel: "Add photos" },
  { key: "ratings", label: "Job ratings", icon: Star, status: "optional", detail: "Complete jobs to build your rating.", href: "/supplier/reputation", actionLabel: "View reputation" },
]

const STATUS_META: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  complete: { label: "Ready", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  action: { label: "Action needed", cls: "bg-red-50 text-red-700", icon: AlertTriangle },
  optional: { label: "Recommended", cls: "bg-amber-50 text-amber-700", icon: Star },
}

export default function SupplierReadinessPage() {
  const [banner, setBanner] = useState<string | null>(null)

  const { pct, blockers } = useMemo(() => {
    const required = CATEGORIES.filter((c) => c.status !== "optional")
    const ready = required.filter((c) => c.status === "complete").length
    const blockers = CATEGORIES.filter((c) => c.status === "action")
    return { pct: Math.round((ready / required.length) * 100), blockers }
  }, [])

  const canStart = blockers.length === 0

  return (
    <div className="space-y-5">
      <MobileTopBar title="First-job readiness" subtitle="Get ready for work" />

      <div>
        <h1 className="text-xl font-semibold text-slate-900">First job readiness</h1>
        <p className="mt-0.5 text-sm text-slate-500">Clear the essentials and you&apos;re ready to start receiving jobs.</p>
      </div>

      {banner && <SupplierBanner tone="emerald" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      {/* Overall readiness */}
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-900">Overall readiness</p>
          <span className={`text-sm font-bold ${canStart ? "text-emerald-600" : "text-slate-900"}`}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full transition-all ${canStart ? "bg-emerald-500" : "bg-[#2563EB]"}`} style={{ width: `${pct}%` }} /></div>
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-slate-500">{canStart ? "You're ready to receive jobs." : `${blockers.length} item${blockers.length === 1 ? "" : "s"} need attention before you can go live.`}</p>
          <SupplierButton disabled={!canStart} onClick={() => setBanner("You're now visible to customers — jobs will appear in Requests.")}>
            <Play className="w-4 h-4" /> Start receiving jobs
          </SupplierButton>
        </div>
      </SupplierCard>

      {/* Missing actions */}
      {blockers.length > 0 && (
        <SupplierCard className="p-5 border-red-100">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" /> What&apos;s missing</h2>
          <div className="space-y-2">
            {blockers.map((b) => (
              <div key={b.key} className="flex items-center gap-3 rounded-xl bg-red-50/60 border border-red-100 p-3">
                <b.icon className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800">{b.label}</p><p className="text-xs text-slate-500">{b.detail}</p></div>
                <Link href={b.href}><SupplierButton size="sm">{b.actionLabel} <ArrowRight className="w-3.5 h-3.5" /></SupplierButton></Link>
              </div>
            ))}
          </div>
        </SupplierCard>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const meta = STATUS_META[c.status]
          return (
            <SupplierCard key={c.key} className="p-4">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><c.icon className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}><meta.icon className="w-3 h-3" />{meta.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.detail}</p>
                  {c.status !== "complete" && (
                    <Link href={c.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">{c.actionLabel} <ArrowRight className="w-3.5 h-3.5" /></Link>
                  )}
                </div>
              </div>
            </SupplierCard>
          )
        })}
      </div>
    </div>
  )
}
