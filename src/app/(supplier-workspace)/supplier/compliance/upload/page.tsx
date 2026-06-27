"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/compliance/upload — upload a compliance document (manifest 57).

   Document details + drag-drop upload (upload-only — no URL inputs), type
   select, valid-from / expiry, a secure-storage note, a submission checklist
   and verification standards. "Submit & queue review" is a typed stub (audit
   TODO). Files are private to the supplier until explicitly approved for public
   trust-badge display. Storage: supplier-workspaces/{wsId}/compliance/…
─────────────────────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, Upload, FileCheck2, Trash2, CheckCircle2, Circle, Lock, ShieldCheck,
} from "lucide-react"
import { SupplierCard, SupplierButton, SupplierBanner, SupplierField, supplierInputClass } from "@/components/supplier-workspace/ui"
import { MobileTopBar } from "@/components/mobile"

export const dynamic = "force-dynamic"

const DOC_TYPES = [
  "Public liability insurance",
  "Gas Safe certificate",
  "Electrical (NICEIC/NAPIT) certificate",
  "Trade licence",
  "DBS / background check",
  "Accreditation",
  "Other",
]

const STANDARDS = [
  "Document is current and not expired",
  "Your business name is clearly shown",
  "All pages are legible",
  "Issued by a recognised authority",
]

export default function SupplierComplianceUploadPage() {
  const router = useRouter()
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [reference, setReference] = useState("")
  const [validFrom, setValidFrom] = useState("")
  const [expiry, setExpiry] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const checklist = useMemo(() => [
    { label: "Document type selected", ok: !!docType },
    { label: "File uploaded", ok: !!fileName },
    { label: "Expiry date set", ok: !!expiry },
  ], [docType, fileName, expiry])
  const ready = checklist.every((c) => c.ok)

  function onFile(f: File | undefined) { if (f) setFileName(f.name) }
  function submit() {
    if (!ready) { setBanner("Complete the checklist before submitting."); return }
    // STUB: TODO upload to supplier-workspaces/{wsId}/compliance/{type}/ then POST
    // document + audit `compliance.document.submitted`. Optimistic redirect.
    router.push("/supplier/compliance")
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title="Upload document" subtitle="Compliance" showBack backHref="/supplier/compliance" />

      <Link href="/supplier/compliance" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to compliance
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Upload compliance document</h1>
        <p className="mt-0.5 text-sm text-slate-500">Add certificates and licences. Our team reviews each before it counts toward your trust badges.</p>
      </div>

      {banner && <SupplierBanner tone="amber" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>}

      <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <SupplierCard className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Document details</h2>
            <SupplierField label="Document type" required>
              <select className={supplierInputClass} value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </SupplierField>
            <SupplierField label="Reference / certificate number">
              <input className={supplierInputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
            </SupplierField>
            <div className="grid grid-cols-2 gap-3">
              <SupplierField label="Valid from"><input type="date" className={supplierInputClass} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></SupplierField>
              <SupplierField label="Expiry date" required><input type="date" className={supplierInputClass} value={expiry} onChange={(e) => setExpiry(e.target.value)} /></SupplierField>
            </div>
          </SupplierCard>

          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Upload file</h2>
            {!fileName ? (
              <button onClick={() => fileRef.current?.click()} className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:bg-[var(--brand-soft)]/30 transition-colors py-12 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Upload className="w-6 h-6" /></div>
                <p className="text-sm font-semibold text-slate-700">Drag &amp; drop or click to upload</p>
                <p className="text-xs text-slate-400">PDF, JPG or PNG · upload-only, no links</p>
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><FileCheck2 className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{fileName}</p><p className="text-xs text-slate-400">Ready to submit</p></div>
                <button onClick={() => setFileName(null)} className="p-2 text-slate-400 hover:text-red-500" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-400 flex items-start gap-1.5"><Lock className="w-3 h-3 mt-0.5 shrink-0" /> Stored securely and kept private to you unless you approve it for public trust-badge display.</p>
          </SupplierCard>
        </div>

        <div className="space-y-4">
          <SupplierCard className="p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Submission checklist</h2>
            <ul className="space-y-2.5">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-2 text-sm">
                  {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />}
                  <span className={c.ok ? "text-slate-600" : "text-slate-800 font-medium"}>{c.label}</span>
                </li>
              ))}
            </ul>
            <SupplierButton onClick={submit} disabled={!ready} className="w-full justify-center mt-4"><Upload className="w-4 h-4" /> Submit &amp; queue review</SupplierButton>
          </SupplierCard>

          <SupplierCard className="p-5">
            <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-600" /><h2 className="text-sm font-semibold text-slate-900">Verification standards</h2></div>
            <ul className="space-y-2">
              {STANDARDS.map((s) => <li key={s} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />{s}</li>)}
            </ul>
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}
