"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/compliance/licences/[licenceId] — licence detail (manifest 64).

   Status + days-to-expiry, tabs Verification / Documents / Reminders / Audit,
   linked services, uploaded certificates and licence history. Reads from
   supplier_licences once wired; seed for now. Licence documents are private
   unless approved for public trust-badge display.
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ShieldCheck, FileText, Bell, History, Download, Upload, CheckCircle2, Wrench, Plus,
} from "lucide-react"
import { SupplierDetailShell, type SupplierDetailTab } from "@/components/supplier-workspace/SupplierDetailShell"
import {
  SupplierCard, SupplierStatusBadge, SupplierButton, SupplierBanner,
} from "@/components/supplier-workspace/ui"
import { shortDate, daysUntil, expiryLabel } from "@/components/supplier-workspace/format"

interface LicenceSeed {
  ref: string
  name: string
  authority: string
  number: string
  status: "verified" | "pending_review" | "expired"
  issuedAt: string
  expiresAt: string
  linkedServices: string[]
  documents: { id: string; name: string; uploadedAt: string }[]
  history: { id: string; label: string; at: string }[]
}

function seed(id: string): LicenceSeed {
  return {
    ref: id,
    name: "Gas Safe Register Licence",
    authority: "Gas Safe Register",
    number: "GS-218840",
    status: "verified",
    issuedAt: new Date(Date.now() - 50 * 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() + 315 * 86_400_000).toISOString(),
    linkedServices: ["Boiler service", "Boiler repair", "Gas safety check"],
    documents: [
      { id: "d1", name: "Gas Safe certificate 2025.pdf", uploadedAt: new Date(Date.now() - 50 * 86_400_000).toISOString() },
      { id: "d2", name: "Gas Safe ID card.jpg", uploadedAt: new Date(Date.now() - 50 * 86_400_000).toISOString() },
    ],
    history: [
      { id: "h1", label: "Licence verified by Propvora", at: new Date(Date.now() - 48 * 86_400_000).toISOString() },
      { id: "h2", label: "Certificate uploaded", at: new Date(Date.now() - 50 * 86_400_000).toISOString() },
    ],
  }
}

export default function SupplierLicenceDetailPage() {
  const { licenceId } = useParams<{ licenceId: string }>()
  const lic = useMemo(() => seed(String(licenceId)), [licenceId])
  const [banner, setBanner] = useState<string | null>(null)
  const days = daysUntil(lic.expiresAt)

  const tabs: SupplierDetailTab[] = [
    {
      key: "verification", label: "Verification", icon: ShieldCheck,
      render: () => (
        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Licence details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Authority" value={lic.authority} />
              <Field label="Licence number" value={lic.number} />
              <Field label="Issued" value={shortDate(lic.issuedAt)} />
              <Field label="Expiry" value={`${shortDate(lic.expiresAt)} · ${expiryLabel(lic.expiresAt)}`} />
            </dl>
          </SupplierCard>
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Linked services</h2>
            <div className="flex flex-wrap gap-2">
              {lic.linkedServices.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 text-slate-700 px-2.5 py-1.5 text-xs font-medium"><Wrench className="w-3.5 h-3.5 text-slate-400" />{s}</span>
              ))}
            </div>
          </SupplierCard>
        </div>
      ),
    },
    {
      key: "documents", label: "Documents", icon: FileText, count: lic.documents.length,
      render: () => (
        <SupplierCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Uploaded certificates</h2>
            <Link href="/supplier/compliance/upload"><SupplierButton size="sm" variant="outline"><Upload className="w-3.5 h-3.5" /> Upload</SupplierButton></Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {lic.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0"><Link href={`/supplier/compliance/documents/${d.id}`} className="text-sm font-medium text-slate-800 hover:text-[var(--brand)] truncate block">{d.name}</Link><p className="text-xs text-slate-400">Uploaded {shortDate(d.uploadedAt)}</p></div>
                <button onClick={() => setBanner("Download started.")} className="p-2 text-slate-400 hover:text-slate-600" aria-label="Download"><Download className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        </SupplierCard>
      ),
    },
    {
      key: "reminders", label: "Reminders", icon: Bell,
      render: () => (
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Expiry reminders</h2>
          <p className="text-sm text-slate-600">We&apos;ll remind you {days != null && days > 0 ? `${Math.min(days, 30)} days before` : "before"} this licence expires so your services stay live.</p>
          <button onClick={() => setBanner("Reminder preferences saved.")} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)]"><Plus className="w-4 h-4" /> Add a custom reminder</button>
        </SupplierCard>
      ),
    },
    {
      key: "audit", label: "Audit", icon: History,
      render: () => (
        <SupplierCard className="p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">History</h2>
          <ol className="space-y-3">
            {lic.history.map((h, i) => (
              <li key={h.id} className="flex gap-3"><div className="flex flex-col items-center"><span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5" />{i < lic.history.length - 1 && <span className="flex-1 w-px bg-slate-200 my-1" />}</div><div><p className="text-sm text-slate-700">{h.label}</p><p className="text-[11px] text-slate-400">{shortDate(h.at)}</p></div></li>
            ))}
          </ol>
        </SupplierCard>
      ),
    },
  ]

  return (
    <>
      {banner && <div className="mb-3"><SupplierBanner tone="emerald" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner></div>}
      <SupplierDetailShell
        backHref="/supplier/compliance"
        backLabel="Back to compliance"
        title={lic.name}
        subtitle={`${lic.authority} · ${lic.number}`}
        status={
          <div className="flex items-center gap-2">
            <SupplierStatusBadge tone={lic.status === "verified" ? "emerald" : lic.status === "expired" ? "red" : "amber"}>{lic.status === "verified" ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />Verified</> : lic.status === "expired" ? "Expired" : "Pending review"}</SupplierStatusBadge>
            {days != null && days > 0 && <span className="text-xs text-slate-400">{days} days left</span>}
          </div>
        }
        tabs={tabs}
        actionBar={
          <div className="sticky bottom-0 z-20 -mx-4 md:-mx-6 lg:-mx-8 mt-6 px-4 md:px-6 lg:px-8 py-3 bg-white/90 backdrop-blur border-t border-slate-200 flex items-center justify-end gap-2">
            <Link href="/supplier/compliance/upload"><SupplierButton variant="outline"><Upload className="w-4 h-4" /> Replace certificate</SupplierButton></Link>
          </div>
        }
      />
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="text-sm font-medium text-slate-800 mt-0.5">{value}</dd></div>
}
