"use client"

import Link from "next/link"
import {
  ArrowLeft, FileSignature, ShieldCheck, Wallet, Fingerprint, Key,
  Download, Upload, MessageSquare, HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { useCustomerToast } from "../components/toast"
import TenancySubNav from "./TenancySubNav"
import TenancySetupCard from "./components/tenancy/TenancySetupCard"
import type { Tenancy } from "../data/lets"

const STEPS = [
  { id: "agreement", label: "Agreement", icon: FileSignature, state: "done" },
  { id: "deposit", label: "Deposit", icon: ShieldCheck, state: "done" },
  { id: "rent", label: "First Rent", icon: Wallet, state: "current" },
  { id: "id", label: "ID Checks", icon: Fingerprint, state: "todo" },
  { id: "ready", label: "Move-in Ready", icon: Key, state: "todo" },
]

export default function TenancySetup({ t }: { t: Tenancy }) {
  const { toast } = useCustomerToast()
  const done = STEPS.filter((s) => s.state === "done").length

  return (
    <div className="space-y-5">
      <Link href={`/customer/lets/tenancies/${t.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]">
        <ArrowLeft className="w-4 h-4" /> Back to tenancy
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-slate-900">Tenancy Setup — agreement, deposit, first rent, ID checks</h1>
          <p className="text-[13px] text-slate-500 mt-1">Complete the remaining steps to secure your tenancy.</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[18px] font-bold text-emerald-600">{Math.round((done / STEPS.length) * 100)}%</p>
          <p className="text-[11px] text-slate-400">complete</p>
        </div>
      </div>
      <TenancySubNav id={t.id} active="setup" />

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <ol className="flex items-start justify-between gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <li key={s.id} className="flex-1 flex flex-col items-center text-center relative">
                {i < STEPS.length - 1 && (
                  <span className={cn("absolute top-5 left-1/2 w-full h-0.5", s.state === "done" ? "bg-emerald-400" : "bg-slate-200")} />
                )}
                <span className={cn("w-10 h-10 rounded-full flex items-center justify-center z-10", s.state === "done" ? "bg-emerald-500 text-white" : s.state === "current" ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-400")}>
                  <Icon className="w-4 h-4" />
                </span>
                <p className={cn("text-[11.5px] font-semibold mt-2", s.state === "current" ? "text-[var(--brand)]" : s.state === "done" ? "text-slate-700" : "text-slate-400")}>
                  {s.label}
                </p>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-3">
          <TenancySetupCard icon={FileSignature} title="1. Agreement" status="Signed" tone="emerald" detail="AST signed on 28 May 2025 · 12-month term" cta="View signed agreement" onClick={() => toast("Opening agreement…", "info")} ctaIcon={Download} />
          <TenancySetupCard icon={ShieldCheck} title="2. Deposit" status="Paid" tone="emerald" detail={`${formatPence(t.depositPence, "GBP")} · DPS protection in progress`} cta="View receipt" onClick={() => toast("Opening receipt…", "info")} ctaIcon={Download} />
          <TenancySetupCard icon={Wallet} title="3. First Rent" status="Due" tone="amber" detail={`${formatPence(t.rentPence, "GBP")} due before move-in`} cta="Pay first rent" primary href={`/customer/lets/tenancies/${t.id}/rent-payments`} ctaIcon={Wallet} />
          <TenancySetupCard icon={Fingerprint} title="4. ID Checks" status="Pending" tone="slate" detail="Right to Rent verification required" cta="Upload ID" onClick={() => toast("ID upload (upload-only) — coming soon", "info")} ctaIcon={Upload} />
          <TenancySetupCard icon={Key} title="5. Move-in Ready" status="Locked" tone="slate" detail="Unlocks once all steps are complete" cta="View requirements" href={`/customer/lets/tenancies/${t.id}/move-in`} ctaIcon={Key} />
        </div>

        <aside className="space-y-5 sticky top-[84px]">
          <Card title="Tenancy summary">
            <Row l="Move-in date" r={t.moveIn} />
            <Row l="Monthly rent" r={formatPence(t.rentPence, "GBP")} />
            <Row l="Deposit" r={formatPence(t.depositPence, "GBP")} />
            <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100">
              <span className="text-[12.5px] font-semibold text-slate-700">Total due before move-in</span>
              <span className="text-[13px] font-bold text-slate-900">{formatPence(t.rentPence + t.depositPence, "GBP")}</span>
            </div>
          </Card>
          <Card title="Contacts">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-200" />
              <div><p className="text-[12px] font-semibold text-slate-800">{t.landlord}</p><p className="text-[10.5px] text-slate-400">Letting agent</p></div>
            </div>
            <button onClick={() => toast("Messaging…", "info")} className="mt-2 w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
              <MessageSquare className="w-4 h-4" /> Message us
            </button>
          </Card>
          <Card title="Need help?">
            <p className="text-[11.5px] text-slate-500 mb-2">Stuck on a step? Our lettings team can help you complete setup.</p>
            <Link href="/customer/help" className="w-full inline-flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
              <HelpCircle className="w-4 h-4" /> Visit help centre
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"><p className="text-[13px] font-bold text-slate-900 mb-2.5">{title}</p>{children}</div>
}
function Row({ l, r }: { l: string; r: string }) {
  return <div className="flex items-center justify-between"><span className="text-[12px] text-slate-500">{l}</span><span className="text-[12px] font-semibold text-slate-800">{r}</span></div>
}
