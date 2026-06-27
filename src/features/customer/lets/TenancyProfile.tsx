"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Calendar, Wallet, MapPin, Users, FileText, ShieldCheck, Key, Wrench,
  ClipboardCheck, Truck, RotateCcw, UserCheck, CheckCircle2, Circle, ChevronRight,
  MessageSquare, Upload, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import { StatusPill } from "../components/StatusPill"
import type { Tenancy } from "../data/lets"

const TABS = [
  { id: "setup", label: "Tenancy Setup" },
  { id: "documents", label: "Documents" },
  { id: "rent", label: "Rent & Deposits" },
  { id: "maintenance", label: "Maintenance" },
  { id: "inspections", label: "Inspections" },
  { id: "movein", label: "Move-in" },
  { id: "renewal", label: "Renewal/Notice" },
  { id: "guarantor", label: "Guarantor / Referencing" },
]
const SETUP_TASKS = [
  { label: "Sign tenancy agreement", done: true },
  { label: "Pay holding deposit", done: true },
  { label: "Pay first month's rent", done: true },
  { label: "Complete Right to Rent check", done: true },
  { label: "Protect security deposit", done: false },
  { label: "Set up rent autopay", done: false },
]

export default function TenancyProfile({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const [tab, setTab] = useState("setup")
  const done = SETUP_TASKS.filter((s) => s.done).length
  const base = `/customer/lets/tenancies/${t.id}`

  return (
    <div className="space-y-5">
      <Link href="/customer/lets?tab=tenancy" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]"><ArrowLeft className="w-4 h-4" /> Back to tenancies</Link>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><h1 className="text-[22px] font-bold text-slate-900">{t.property} tenancy</h1><StatusPill tone="emerald">{t.status}</StatusPill></div>
          <p className="text-[12px] text-slate-400">{t.id}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-4">
          <Hero icon={Calendar} label="Move-in date" value={t.moveIn} />
          <Hero icon={Wallet} label="Monthly rent" value={formatPence(t.rentPence, "GBP")} />
          <Hero icon={Calendar} label="Next payment" value={t.nextPaymentDate} />
          <Hero icon={MapPin} label="Address" value={t.location} />
          <Hero icon={ShieldCheck} label="Status" value={t.status} />
        </div>
      </div>

      {/* Internal tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((x) => <button key={x.id} onClick={() => setTab(x.id)} className={cn("px-3.5 py-2.5 text-[13px] font-semibold border-b-2 -mb-px whitespace-nowrap", x.id === tab ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800")}>{x.label}</button>)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5">
          {tab === "setup" && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2"><h3 className="text-[14px] font-bold text-slate-900">Onboarding progress</h3><span className="text-[12px] font-semibold text-[var(--brand)]">{done}/{SETUP_TASKS.length} complete</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${(done / SETUP_TASKS.length) * 100}%` }} /></div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {SETUP_TASKS.map((s) => <li key={s.label} className="flex items-center gap-2 text-[12.5px]">{s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}<span className={s.done ? "text-slate-500 line-through" : "text-slate-700"}>{s.label}</span></li>)}
                </ul>
                <Link href={`${base}/setup`} className="mt-4 inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold">Continue setup <ChevronRight className="w-4 h-4" /></Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card title="Landlord / Agent" icon={UserCheck}><div className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-slate-200 shrink-0" /><div><p className="text-[12.5px] font-semibold text-slate-800">{t.landlord}</p><p className="text-[11px] text-slate-400">Managing agent · Propvora Lettings</p></div></div><button onClick={() => toast("Messaging…", "info")} className="mt-2 text-[12px] font-semibold text-[var(--brand)]">Message letting team</button></Card>
                <Card title="Occupants" icon={Users}><p className="text-[12.5px] text-slate-700">You <span className="text-[10.5px] text-slate-400">(lead tenant)</span></p><p className="text-[11.5px] text-slate-400 mt-1">Household details from your profile</p></Card>
                <Card title="Tenancy agreement" icon={FileText}><div className="flex items-center justify-between"><p className="text-[12px] text-slate-600">AST · 12 months</p><StatusPill tone="emerald">Signed</StatusPill></div><Link href={`${base}/documents`} className="mt-2 inline-block text-[12px] font-semibold text-[var(--brand)]">View agreement →</Link></Card>
                <Card title="Deposit protection" icon={ShieldCheck}><div className="flex items-center justify-between"><p className="text-[12px] text-slate-600">{formatPence(t.depositPence, "GBP")}</p><StatusPill tone="amber">Pending</StatusPill></div><p className="text-[11px] text-slate-400 mt-1">DPS · protection in progress</p></Card>
              </div>
            </>
          )}

          {tab === "documents" && <LinkPanel icon={FileText} title="Tenancy documents" sub="Agreement, inventory, certificates and receipts." href={`${base}/documents`} cta="Open documents" />}
          {tab === "rent" && <LinkPanel icon={Wallet} title="Rent & deposits" sub="Rent schedule, receipts, arrears and deposit tracker." href={`${base}/rent-payments`} cta="Open rent payments" />}
          {tab === "maintenance" && <LinkPanel icon={Wrench} title="Maintenance" sub="Report repairs and track jobs in progress." href={`${base}/maintenance`} cta="Open maintenance" />}
          {tab === "movein" && <LinkPanel icon={Truck} title="Move-in" sub="Keys, inventory, meter readings and condition photos." href={`${base}/move-in`} cta="Open move-in checklist" />}
          {tab === "inspections" && <Inline icon={ClipboardCheck} title="Inspections" rows={[["Mid-term inspection", "15 Jul 2025", "Scheduled"], ["Move-in inspection", "1 Apr 2025", "Completed"]]} toast={toast} />}
          {tab === "renewal" && <Inline icon={RotateCcw} title="Renewal / Notice" rows={[["Renewal window opens", "1 Jan 2026", "Upcoming"], ["Minimum notice period", "1 month", "—"]]} toast={toast} extra="renewal" />}
          {tab === "guarantor" && <Inline icon={UserCheck} title="Guarantor / Referencing" rows={[["Employment reference", "Verified", "Complete"], ["Previous landlord", "Pending", "Awaiting"], ["Credit check", "Passed", "Complete"], ["Guarantor", "Michael Johnson", "Verified"]]} toast={toast} />}
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <Card title="Quick actions" icon={Key}>
            <QA icon={FileText} label="View agreement" href={`${base}/documents`} />
            <QA icon={Wallet} label="View payment schedule" href={`${base}/rent-payments`} />
            <QA icon={Wrench} label="Report maintenance" href={`${base}/maintenance`} />
            <QA icon={Truck} label="Move-in checklist" href={`${base}/move-in`} />
            <QA icon={Key} label="Collect keys" onClick={() => toast("Key collection — coming soon", "info")} />
          </Card>
          <Card title="Tenancy summary" icon={ShieldCheck}>
            <Row l="Tenancy ID" r={t.id} />
            <Row l="Term" r={`${t.termMonths} months`} />
            <Row l="Start date" r={t.startDate} />
            <Row l="Deposit" r={formatPence(t.depositPence, "GBP")} />
            <Row l="Rent" r={`${formatPence(t.rentPence, "GBP")}/mo`} />
          </Card>
          <Card title="Support & help" icon={MessageSquare}>
            <p className="text-[11.5px] text-slate-500 mb-2">Questions about your tenancy? Our lettings team is here to help.</p>
            <Link href="/customer/help" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"><MessageSquare className="w-4 h-4" /> Contact letting team</Link>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Hero({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><div><p className="text-[10.5px] text-slate-400">{label}</p><p className="text-[12.5px] font-semibold text-slate-800">{value}</p></div></div>
}
function Card({ title, icon: Icon, children }: { title: string; icon: typeof Key; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[13px] font-bold text-slate-900 mb-2.5 flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</p>{children}</div>
}
function LinkPanel({ icon: Icon, title, sub, href, cta }: { icon: typeof FileText; title: string; sub: string; href: string; cta: string }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center"><span className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center mx-auto"><Icon className="w-6 h-6" /></span><p className="text-[15px] font-bold text-slate-900 mt-3">{title}</p><p className="text-[12.5px] text-slate-500 mt-1">{sub}</p><Link href={href} className="mt-4 inline-flex items-center gap-1.5 bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-[13px] font-semibold">{cta} <ExternalLink className="w-4 h-4" /></Link></div>
}
function Inline({ icon: Icon, title, rows, toast, extra }: { icon: typeof Key; title: string; rows: string[][]; toast: (m: string, k?: "success" | "info" | "warning" | "error") => void; extra?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</h3>
      <div className="divide-y divide-slate-50">
        {rows.map((r) => <div key={r[0]} className="flex items-center justify-between py-2.5"><div><p className="text-[12.5px] font-semibold text-slate-800">{r[0]}</p><p className="text-[11px] text-slate-400">{r[1]}</p></div><StatusPill tone={r[2] === "Completed" || r[2] === "Complete" || r[2] === "Verified" ? "emerald" : r[2] === "Scheduled" || r[2] === "Upcoming" ? "blue" : r[2] === "Awaiting" ? "amber" : "slate"}>{r[2]}</StatusPill></div>)}
      </div>
      {extra === "renewal" && <div className="flex gap-2 mt-3"><button onClick={() => toast("Renewal request — coming soon", "info")} className="bg-[var(--brand)] text-white rounded-xl px-3.5 py-2 text-[12.5px] font-semibold">Renew tenancy</button><button onClick={() => toast("Give notice — coming soon", "info")} className="border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] font-semibold text-slate-700">Give notice</button></div>}
    </div>
  )
}
function QA({ icon: Icon, label, href, onClick }: { icon: typeof Key; label: string; href?: string; onClick?: () => void }) {
  const cls = "w-full flex items-center gap-2.5 py-2 group"
  const inner = <><span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-[var(--brand-soft)] group-hover:text-[var(--brand)] shrink-0"><Icon className="w-4 h-4" /></span><span className="flex-1 text-left text-[12.5px] font-medium text-slate-700">{label}</span><ChevronRight className="w-4 h-4 text-slate-300" /></>
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">{l}</span><span className="text-[12px] font-semibold text-slate-800">{r}</span></div>
}
