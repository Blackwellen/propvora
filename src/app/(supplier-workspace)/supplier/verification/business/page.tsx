"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/verification/business — business verification wizard (manifest
   59 & 60).

   Step 1 Business details · Step 2 Upload proof · Step 3 Review & submit. The
   business-verification check from the verification hub. Upload is upload-only;
   the proof document is private until reviewed. Submit is a typed stub (audit
   TODO). `?step=` deep-links the entry. Reuses SupplierWizardShell.
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2, Upload, CheckCircle2, Circle, FileCheck2, Trash2, ShieldCheck, Lock,
} from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "@/components/supplier-workspace/wizard/SupplierWizardShell"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"

const STEPS: WizardStepMeta[] = [
  { label: "Business details", subtitle: "Company information", icon: Building2 },
  { label: "Upload proof", subtitle: "Evidence of trading", icon: Upload },
  { label: "Review & submit", subtitle: "Confirm and send", icon: CheckCircle2 },
]

const PROOF_TYPES = [
  "Companies House registration",
  "VAT registration certificate",
  "Business bank statement",
  "Utility bill (business address)",
]

export default function SupplierBusinessVerificationPage() {
  return <Suspense fallback={null}><BusinessVerificationInner /></Suspense>
}

function BusinessVerificationInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { workspaceId } = useSupplierWorkspace()
  const stepParam = params.get("step")
  const initialStep = stepParam === "review" ? 2 : stepParam === "upload" ? 1 : 0

  const [current, setCurrent] = useState(initialStep)
  const [finishing, setFinishing] = useState(false)
  const [legalName, setLegalName] = useState("")
  const [companyNumber, setCompanyNumber] = useState("")
  const [tradingAddress, setTradingAddress] = useState("")
  const [proofType, setProofType] = useState(PROOF_TYPES[0])
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileName = file?.name ?? null

  const checklist = useMemo(() => [
    { label: "Legal business name", ok: legalName.trim().length > 1 },
    { label: "Company / registration number", ok: companyNumber.trim().length > 3 },
    { label: "Trading address", ok: tradingAddress.trim().length > 4 },
    { label: "Proof document uploaded", ok: !!file },
  ], [legalName, companyNumber, tradingAddress, file])

  const canContinue = current === 0
    ? checklist.slice(0, 3).every((c) => c.ok)
    : current === 1
      ? !!file
      : checklist.every((c) => c.ok)

  function back() { router.push("/supplier/verification") }

  async function submit() {
    if (!workspaceId || !file) {
      setError("Workspace not ready or no document attached.")
      return
    }
    setFinishing(true)
    setError(null)
    try {
      // 1) Upload the proof document to R2.
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      form.append("folder", "verification/business")
      const upRes = await fetch("/api/upload", { method: "POST", body: form })
      if (!upRes.ok) {
        const b = (await upRes.json().catch(() => null)) as { error?: string } | null
        setError(b?.error ?? "Upload failed. Please try again.")
        setFinishing(false)
        return
      }
      const up = (await upRes.json()) as { key: string }

      // 2) Record the document against the supplier's verification (status "uploaded").
      const postRes = await fetch("/api/supplier/verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          kind: "document",
          docType: "other",
          nameOnDocument: legalName.trim(),
          documentNumber: companyNumber.trim(),
          r2Key: up.key,
        }),
      })
      if (!postRes.ok) {
        const b = (await postRes.json().catch(() => null)) as { error?: string } | null
        setError(b?.error ?? "Could not submit verification. Please try again.")
        setFinishing(false)
        return
      }
      router.push("/supplier/verification")
    } catch {
      setError("Network error. Please try again.")
      setFinishing(false)
    }
  }
  function onFile(f: File | undefined) { if (f) setFile(f) }

  const livePanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Business verification</p>
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span>
          <div><p className="text-sm font-semibold text-slate-900">{legalName || "Your business"}</p><p className="text-xs text-slate-400">{companyNumber || "Reg. number"}</p></div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Checklist</p>
        <ul className="space-y-1.5">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-xs">
              {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />}
              <span className={c.ok ? "text-slate-600" : "text-slate-400"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[11px] text-slate-400 flex items-start gap-1.5"><Lock className="w-3 h-3 mt-0.5 shrink-0" /> Verification evidence is reviewed by our team and never shown publicly.</p>
    </div>
  )

  return (
    <SupplierWizardShell
      title="Business verification"
      steps={STEPS}
      current={current}
      onStepSelect={setCurrent}
      onClose={back}
      onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
      onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
      onFinish={submit}
      canContinue={canContinue}
      finishing={finishing}
      finishLabel="Submit verification"
      livePanel={livePanel}
    >
      {current === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Business details</h2>
            <p className="text-sm text-slate-500 mt-0.5">Tell us about your registered business. We check this against your proof document.</p>
          </div>
          <Field label="Legal business name" required><input className={inputClass} value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="e.g. Morgan Heating & Plumbing Ltd" /></Field>
          <Field label="Company / registration number" required><input className={inputClass} value={companyNumber} onChange={(e) => setCompanyNumber(e.target.value)} placeholder="e.g. 12345678" /></Field>
          <Field label="Trading address" required><input className={inputClass} value={tradingAddress} onChange={(e) => setTradingAddress(e.target.value)} placeholder="Street, city, postcode" /></Field>
        </div>
      )}

      {current === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload proof of business</h2>
            <p className="text-sm text-slate-500 mt-0.5">Upload one document that proves your business exists and trades.</p>
          </div>
          <Field label="Proof type"><select className={inputClass} value={proofType} onChange={(e) => setProofType(e.target.value)}>{PROOF_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} />
          {!fileName ? (
            <button onClick={() => fileRef.current?.click()} className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#2563EB] hover:bg-blue-50/30 transition-colors py-12 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Upload className="w-6 h-6" /></div>
              <p className="text-sm font-semibold text-slate-700">Drag &amp; drop or click to upload</p>
              <p className="text-xs text-slate-400">PDF, JPG or PNG · upload-only, no links</p>
            </button>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><FileCheck2 className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{fileName}</p><p className="text-xs text-slate-400">{proofType}</p></div>
              <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {current === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review &amp; submit</h2>
            <p className="text-sm text-slate-500 mt-0.5">Confirm your details before sending for review.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <Row k="Legal name" v={legalName || "—"} />
            <Row k="Reg. number" v={companyNumber || "—"} />
            <Row k="Trading address" v={tradingAddress || "—"} />
            <Row k="Proof type" v={proofType} />
            <Row k="Document" v={fileName ?? "Not uploaded"} />
          </div>
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3 text-xs text-blue-700">Our team typically reviews business verification within 1–2 working days. You&apos;ll be notified of the outcome.</div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-700">{error}</div>}
        </div>
      )}
    </SupplierWizardShell>
  )
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span><div className="mt-1.5">{children}</div></label>
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between px-4 py-3"><span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-800 text-right max-w-[60%] truncate">{v}</span></div>
}
