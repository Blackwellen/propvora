"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/payouts/[payoutId]/blockers — payout blocker resolution
   (manifest image 53).

   Lists the open release blockers (missing photos, customer sign-off, invoice,
   insurance cert, payment terms…) with a resolution affordance per blocker and
   an overall progress bar. Upload affordances are upload-only (no URL inputs).
   Each resolution writes an audit event (stubbed until backend lands).
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ChevronLeft, AlertTriangle, CheckCircle2, Upload, ArrowRight, Camera,
  PenLine, FileText, ShieldCheck, FileCheck2, BadgeCheck,
} from "lucide-react"
import { SupplierCard, SupplierStatusBadge, SupplierButton, SupplierBanner } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"
import { getSeedPayoutDetail, type PayoutBlocker } from "@/features/supplier/finance/data/payout-detail"

export const dynamic = "force-dynamic"

const KIND_ICON: Record<PayoutBlocker["kind"], typeof Camera> = {
  evidence: Camera,
  sign_off: PenLine,
  invoice: FileText,
  insurance: ShieldCheck,
  terms: FileCheck2,
  kyc: BadgeCheck,
}

export default function SupplierPayoutBlockersPage() {
  const { payoutId } = useParams<{ payoutId: string }>()
  const payout = useMemo(() => getSeedPayoutDetail(payoutId), [payoutId])

  // Local resolution state layered over the seed (optimistic; audit-stubbed).
  const [resolved, setResolved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(payout.blockers.filter((b) => b.status === "resolved").map((b) => [b.id, true]))
  )
  const [banner, setBanner] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingUpload = useRef<string | null>(null)

  const total = payout.blockers.length
  const done = payout.blockers.filter((b) => resolved[b.id]).length
  const pct = total ? Math.round((done / total) * 100) : 100
  const allClear = done === total

  function resolve(b: PayoutBlocker) {
    // STUB: TODO(supplier-payouts): call the resolution endpoint per kind, then
    // write audit event `payout.blocker.resolved`. Optimistic for now.
    setResolved((r) => ({ ...r, [b.id]: true }))
    setBanner(`"${b.title}" marked resolved.`)
  }

  function onPickFile(b: PayoutBlocker) {
    pendingUpload.current = b.id
    fileRef.current?.click()
  }

  function onFileChosen(file: File | undefined) {
    const id = pendingUpload.current
    if (!file || !id) return
    const b = payout.blockers.find((x) => x.id === id)
    // STUB: TODO upload to supplier-workspaces/{wsId}/payouts/{payoutId}/...
    setResolved((r) => ({ ...r, [id]: true }))
    setBanner(b ? `Uploaded ${file.name} — "${b.title}" resolved.` : "Uploaded.")
    pendingUpload.current = null
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Resolve blockers" subtitle={`Payout ${payout.ref}`} showBack backHref={`/supplier/payouts/${payout.ref}`} />

      <Link href={`/supplier/payouts/${payout.ref}`} className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to payout
      </Link>

      <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onFileChosen(e.target.files?.[0])} />

      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-slate-900">Payout blocker resolution</h1>
          <SupplierStatusBadge tone={allClear ? "emerald" : "red"}>{allClear ? "Ready to release" : "Blocked"}</SupplierStatusBadge>
        </div>
        <p className="mt-0.5 text-sm text-slate-500">Clear each item to release payout {payout.ref}.</p>
      </div>

      {banner && <SupplierBanner tone="emerald" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      {/* Progress */}
      <SupplierCard className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-900">Resolution progress</p>
          <span className="text-sm font-bold text-slate-900">{done}/{total} cleared</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${allClear ? "bg-emerald-500" : "bg-[#2563EB]"}`} style={{ width: `${pct}%` }} />
        </div>
        {allClear && (
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> All conditions met — this payout can now be released by the platform.</p>
            <Link href={`/supplier/payouts/${payout.ref}`}><SupplierButton variant="outline">Back to payout <ArrowRight className="w-4 h-4" /></SupplierButton></Link>
          </div>
        )}
      </SupplierCard>

      {/* Blockers */}
      <div className="space-y-3">
        {payout.blockers.map((b) => {
          const Icon = KIND_ICON[b.kind]
          const isResolved = resolved[b.id]
          return (
            <SupplierCard key={b.id} className={`p-4 ${isResolved ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isResolved ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {isResolved ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                    {b.jobRef && <span className="text-[11px] font-medium text-slate-400">{b.jobRef}</span>}
                    {isResolved && <SupplierStatusBadge tone="emerald">Resolved</SupplierStatusBadge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{b.detail}</p>
                </div>
                {!isResolved && (
                  <div className="shrink-0">
                    {b.action.type === "upload" ? (
                      <SupplierButton size="sm" onClick={() => onPickFile(b)}><Upload className="w-3.5 h-3.5" /> {b.action.label}</SupplierButton>
                    ) : b.action.type === "link" && b.action.href ? (
                      <Link href={b.action.href}><SupplierButton size="sm" variant="outline">{b.action.label} <ArrowRight className="w-3.5 h-3.5" /></SupplierButton></Link>
                    ) : (
                      <SupplierButton size="sm" variant="outline" onClick={() => resolve(b)}><CheckCircle2 className="w-3.5 h-3.5" /> {b.action.label}</SupplierButton>
                    )}
                  </div>
                )}
              </div>
            </SupplierCard>
          )
        })}
      </div>

      <p className="flex items-start gap-2 text-xs text-slate-400">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Payouts are released by the platform once all conditions are met — resolving blockers here doesn&apos;t trigger payment directly.
      </p>
    </div>
  )
}
