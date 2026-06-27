"use client"

import { useMemo, useState } from "react"
import { Tag, FileText, Banknote, CheckCircle2, Wrench } from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "./SupplierWizardShell"
import { SupplierField, SupplierBanner, supplierInputClass, supplierTextareaClass } from "../ui"
import { moneyPence } from "../format"

/* Multi-step service-creation wizard, mirroring the planning-wizard shell. Every
   stage writes to the real /api/supplier/services route on finish (no mock). */

const STEPS: WizardStepMeta[] = [
  { label: "Basics", subtitle: "Name & category", icon: Tag },
  { label: "Description", subtitle: "What's included", icon: FileText },
  { label: "Pricing", subtitle: "Model & rates", icon: Banknote },
  { label: "Review", subtitle: "Confirm & create", icon: CheckCircle2 },
]

interface Form {
  name: string
  category: string
  description: string
  pricing_model: "hourly" | "fixed" | "quote_required"
  rate: string
  callout: string
}

const EMPTY: Form = { name: "", category: "", description: "", pricing_model: "quote_required", rate: "", callout: "" }
const PRICING_LABEL: Record<string, string> = { hourly: "Per hour", fixed: "Fixed price", quote_required: "Quote required" }

export function ServiceWizard({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string | null
  onClose: () => void
  onCreated: () => void
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canContinue = useMemo(() => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 2 && form.pricing_model !== "quote_required") return form.rate.trim().length > 0
    return true
  }, [step, form])

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function finish() {
    if (!workspaceId) { setError("Workspace not ready — retry in a moment."); return }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/supplier/services", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: form.name.trim(),
          category: form.category || null,
          description: form.description || null,
          pricing_model: form.pricing_model,
          rate_pence: form.rate ? Math.round(Number(form.rate) * 100) : null,
          callout_fee_pence: form.callout ? Math.round(Number(form.callout) * 100) : null,
        }),
      })
      if (!res.ok) { setError("Couldn't create the service. Please try again."); return }
      onCreated()
      onClose()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setBusy(false)
    }
  }

  const livePanel = (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Live preview</p>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] flex items-center justify-center"><Wrench className="w-4 h-4 text-[var(--brand)]" /></div>
            <p className="text-sm font-semibold text-slate-900 truncate">{form.name || "Untitled service"}</p>
          </div>
          {form.category && <p className="text-xs text-slate-400 mt-2">{form.category}</p>}
          {form.description && <p className="text-xs text-slate-500 mt-1 line-clamp-3">{form.description}</p>}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{PRICING_LABEL[form.pricing_model]}</span>
            {form.rate && <span className="font-semibold text-slate-800">{moneyPence(Math.round(Number(form.rate) * 100))}{form.pricing_model === "hourly" ? "/hr" : ""}</span>}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400">This is exactly how the service appears in your catalogue and to property managers.</p>
    </div>
  )

  return (
    <SupplierWizardShell
      title="New service"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onClose={onClose}
      onPrev={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onFinish={finish}
      canContinue={canContinue}
      finishing={busy}
      finishLabel="Create service"
      livePanel={livePanel}
    >
      {error && <div className="mb-4"><SupplierBanner tone="red" onDismiss={() => setError(null)}>{error}</SupplierBanner></div>}

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">What service are you adding?</h2>
            <p className="text-sm text-slate-500 mt-1">Give it a clear name property managers will recognise.</p>
          </div>
          <SupplierField label="Service name" required>
            <input className={supplierInputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Emergency boiler repair" autoFocus />
          </SupplierField>
          <SupplierField label="Category" hint="Helps with marketplace search.">
            <input className={supplierInputClass} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. plumbing" />
          </SupplierField>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Describe what's included</h2>
            <p className="text-sm text-slate-500 mt-1">Scope, assumptions and what makes your service stand out.</p>
          </div>
          <SupplierField label="Description">
            <textarea className={supplierTextareaClass} rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What the customer gets, typical turnaround, materials included…" />
          </SupplierField>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">How do you price this?</h2>
            <p className="text-sm text-slate-500 mt-1">Pick a model. Rates are stored to the penny.</p>
          </div>
          <SupplierField label="Pricing model" required>
            <select className={supplierInputClass} value={form.pricing_model} onChange={(e) => set("pricing_model", e.target.value as Form["pricing_model"])}>
              <option value="quote_required">Quote required</option>
              <option value="hourly">Per hour</option>
              <option value="fixed">Fixed price</option>
            </select>
          </SupplierField>
          {form.pricing_model !== "quote_required" && (
            <div className="grid grid-cols-2 gap-3">
              <SupplierField label={form.pricing_model === "hourly" ? "Hourly rate (GBP)" : "Fixed price (GBP)"} required>
                <input className={supplierInputClass} inputMode="decimal" value={form.rate} onChange={(e) => set("rate", e.target.value)} placeholder="0.00" />
              </SupplierField>
              <SupplierField label="Call-out fee (GBP)">
                <input className={supplierInputClass} inputMode="decimal" value={form.callout} onChange={(e) => set("callout", e.target.value)} placeholder="0.00" />
              </SupplierField>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review & create</h2>
            <p className="text-sm text-slate-500 mt-1">Confirm the details, then add it to your catalogue.</p>
          </div>
          <dl className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            <ReviewRow label="Name" value={form.name || "—"} />
            <ReviewRow label="Category" value={form.category || "—"} />
            <ReviewRow label="Pricing" value={PRICING_LABEL[form.pricing_model]} />
            {form.rate && <ReviewRow label="Rate" value={`${moneyPence(Math.round(Number(form.rate) * 100))}${form.pricing_model === "hourly" ? "/hr" : ""}`} />}
            {form.callout && <ReviewRow label="Call-out fee" value={moneyPence(Math.round(Number(form.callout) * 100))} />}
          </dl>
        </div>
      )}
    </SupplierWizardShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  )
}
