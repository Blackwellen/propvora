"use client"

/* ──────────────────────────────────────────────────────────────────────────
   /supplier/insurance/renew — insurance renewal wizard (manifest 61, 62, 63).

   Step 1 Policy details · Step 2 Upload policy · Step 3 Review & submit. Shows
   the current policy, validates coverage/expiry, and previews the trust-badge
   impact. Upload is upload-only (no URL inputs); the document is private until
   reviewed. Submit is a typed stub (audit TODO). `?step=` deep-links the entry.
   Reuses SupplierWizardShell (no new chrome).
─────────────────────────────────────────────────────────────────────────── */

import { Suspense, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  FileText, Upload, CheckCircle2, Circle, ShieldCheck, FileCheck2, Trash2,
} from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "@/components/supplier-workspace/wizard/SupplierWizardShell"
import { moneyPence, shortDate } from "@/components/supplier-workspace/format"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl, useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"

const STEPS: WizardStepMeta[] = [
  { label: "Policy details", subtitle: "Insurer & coverage", icon: FileText },
  { label: "Upload policy", subtitle: "Attach the certificate", icon: Upload },
  { label: "Review & submit", subtitle: "Confirm and send", icon: CheckCircle2 },
]

const COVERAGE_BY_SERVICE = [
  { service: "Boiler & heating", requiredPence: 200000000, label: "£2m public liability" },
  { service: "Electrical", requiredPence: 200000000, label: "£2m public liability" },
  { service: "General maintenance", requiredPence: 100000000, label: "£1m public liability" },
]

interface InsurancePolicy {
  id: string
  insurance_type: string
  provider: string | null
  policy_number_masked: string | null
  coverage_amount_pence: number | null
  valid_to: string | null
  status: string
  expired: boolean
}

function poundsToPence(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export default function SupplierInsuranceRenewPage() {
  return <Suspense fallback={null}><InsuranceRenewInner /></Suspense>
}

function InsuranceRenewInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { workspaceId } = useSupplierWorkspace()
  const stepParam = params.get("step")
  const initialStep = stepParam === "upload" ? 1 : stepParam === "review" ? 2 : 0

  const verification = useSupplierApi<InsurancePolicy[]>(
    useSupplierApiUrl("/api/supplier/verification"),
    { select: (j) => (j as { insurance?: InsurancePolicy[] }).insurance ?? [] }
  )
  const currentPolicy = (verification.data ?? [])[0] ?? null

  const [current, setCurrent] = useState(initialStep)
  const [finishing, setFinishing] = useState(false)
  const [insurer, setInsurer] = useState("")
  const [policyNumber, setPolicyNumber] = useState("")
  const [coverPounds, setCoverPounds] = useState("2000000")
  const [expiry, setExpiry] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileName = file?.name ?? null

  const coverPence = poundsToPence(coverPounds)
  const maxRequired = Math.max(...COVERAGE_BY_SERVICE.map((c) => c.requiredPence))
  const coverOk = coverPence >= maxRequired
  const expiryOk = !!expiry && new Date(expiry).getTime() > Date.now()

  const validations = useMemo(() => [
    { label: "Insurer named", ok: insurer.trim().length > 1 },
    { label: "Policy number entered", ok: policyNumber.trim().length > 2 },
    { label: `Cover meets ${moneyPence(maxRequired)} minimum`, ok: coverOk },
    { label: "Expiry date is in the future", ok: expiryOk },
    { label: "Certificate uploaded", ok: !!file },
  ], [insurer, policyNumber, coverOk, expiryOk, file, maxRequired])

  const canContinue = current === 0
    ? validations.slice(0, 4).every((v) => v.ok)
    : current === 1
      ? !!file
      : validations.every((v) => v.ok)

  function back() { router.push("/supplier/insurance") }

  async function submit() {
    if (!workspaceId || !file) {
      setError("Workspace not ready or no certificate attached.")
      return
    }
    setFinishing(true)
    setError(null)
    try {
      // 1) Upload the certificate to R2.
      const form = new FormData()
      form.append("file", file)
      form.append("workspaceId", workspaceId)
      form.append("folder", "compliance/insurance")
      const upRes = await fetch("/api/upload", { method: "POST", body: form })
      if (!upRes.ok) {
        const b = (await upRes.json().catch(() => null)) as { error?: string } | null
        setError(b?.error ?? "Upload failed. Please try again.")
        setFinishing(false)
        return
      }
      const up = (await upRes.json()) as { key: string }

      // 2) Record the policy against verification (status "uploaded", awaiting review).
      const postRes = await fetch("/api/supplier/verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          kind: "insurance",
          insuranceType: "public_liability",
          provider: insurer.trim(),
          policyNumber: policyNumber.trim(),
          coverageAmountPence: coverPence,
          validTo: expiry || null,
          r2Key: up.key,
        }),
      })
      if (!postRes.ok) {
        const b = (await postRes.json().catch(() => null)) as { error?: string } | null
        setError(b?.error ?? "Could not submit the renewal. Please try again.")
        setFinishing(false)
        return
      }
      router.push("/supplier/insurance")
    } catch {
      setError("Network error. Please try again.")
      setFinishing(false)
    }
  }
  function onFile(f: File | undefined) { if (f) setFile(f) }

  const badgeImpact = coverOk && expiryOk

  const livePanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Current policy</p>
        {verification.loading ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : currentPolicy ? (
          <>
            <p className="text-sm font-semibold text-slate-900">{currentPolicy.provider ?? "Policy on file"}</p>
            <p className="text-xs text-slate-400">{currentPolicy.policy_number_masked ?? "—"}</p>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Cover</dt><dd className="font-semibold text-slate-800">{currentPolicy.coverage_amount_pence != null ? moneyPence(currentPolicy.coverage_amount_pence) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Expiry</dt><dd className={`font-semibold ${currentPolicy.expired ? "text-red-600" : "text-slate-800"}`}>{currentPolicy.valid_to ? shortDate(currentPolicy.valid_to) : "—"}</dd></div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-slate-500">No policy on file yet. Upload your certificate to add one.</p>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Trust badge impact</p>
        <div className="flex items-center gap-2">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${badgeImpact ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}><ShieldCheck className="w-4 h-4" /></span>
          <div><p className="text-sm font-semibold text-slate-900">{badgeImpact ? "Insured badge retained" : "Badge at risk"}</p><p className="text-xs text-slate-400">{badgeImpact ? "Meets marketplace requirements" : "Renew to keep eligibility"}</p></div>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Validations</p>
        <ul className="space-y-1.5">
          {validations.map((v) => (
            <li key={v.label} className="flex items-start gap-2 text-xs">
              {v.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />}
              <span className={v.ok ? "text-slate-600" : "text-slate-400"}>{v.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <SupplierWizardShell
      title="Insurance renewal"
      steps={STEPS}
      current={current}
      onStepSelect={setCurrent}
      onClose={back}
      onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
      onNext={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
      onFinish={submit}
      canContinue={canContinue}
      finishing={finishing}
      finishLabel="Submit insurance"
      livePanel={livePanel}
    >
      {current === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Policy details</h2>
            <p className="text-sm text-slate-500 mt-0.5">Enter your renewed public liability policy. Coverage is checked against each service you offer.</p>
          </div>
          <Field label="Insurer" required><input className={inputClass} value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="e.g. Hiscox" /></Field>
          <Field label="Policy number" required><input className={inputClass} value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="PL-XXXXX-YYYY" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cover amount (£)" required>
              <input className={inputClass} inputMode="decimal" value={coverPounds} onChange={(e) => setCoverPounds(e.target.value)} placeholder="2000000" />
            </Field>
            <Field label="Expiry date" required>
              <input type="date" className={inputClass} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </Field>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">Coverage by service</p>
            <ul className="space-y-2">
              {COVERAGE_BY_SERVICE.map((c) => {
                const ok = coverPence >= c.requiredPence
                return (
                  <li key={c.service} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{c.service}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-600" : "text-amber-600"}`}>
                      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{c.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {current === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload policy certificate</h2>
            <p className="text-sm text-slate-500 mt-0.5">Attach your certificate as a PDF or image. It stays private to you until our team reviews it.</p>
          </div>
          <input ref={fileRef} type="file" hidden accept="image/*,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} />
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
              <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {current === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Review &amp; submit</h2>
            <p className="text-sm text-slate-500 mt-0.5">Confirm your renewal before sending it for review.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <Row k="Insurer" v={insurer || "—"} />
            <Row k="Policy number" v={policyNumber || "—"} />
            <Row k="Cover amount" v={moneyPence(coverPence)} />
            <Row k="Expiry" v={expiry ? shortDate(expiry) : "—"} />
            <Row k="Certificate" v={fileName ?? "Not uploaded"} />
          </div>
          <div className={`rounded-xl border px-4 py-3 text-sm ${badgeImpact ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
            {badgeImpact ? "This renewal keeps your Insured trust badge and marketplace eligibility." : "Heads up: this policy doesn't meet every service's minimum cover — some listings may be paused."}
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>
      )}
    </SupplierWizardShell>
  )
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between px-4 py-3"><span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-800 text-right max-w-[60%] truncate">{v}</span></div>
}
