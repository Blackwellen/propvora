"use client"

import { useMemo, useState } from "react"
import { UserCircle, Building2, Tag, FileText, CheckCircle2 } from "lucide-react"
import { SupplierWizardShell, type WizardStepMeta } from "./SupplierWizardShell"
import { SupplierField, SupplierBanner, supplierInputClass, supplierTextareaClass } from "../ui"
import { humaniseStatus } from "../ui"

/* Supplier onboarding wizard on the planning-wizard shell. Each step persists to
   the REAL /api/supplier/profile route (backed by supplier_workspace_profiles:
   display_name, trades[], bio, years_experience, base_location, accepts_emergency,
   service_radius_km). No mock — Save writes the live row. */

const STEPS: WizardStepMeta[] = [
  { label: "Business", subtitle: "Name & experience", icon: Building2 },
  { label: "Trades", subtitle: "What you cover", icon: Tag },
  { label: "Coverage", subtitle: "Where you work", icon: UserCircle },
  { label: "About", subtitle: "Your bio", icon: FileText },
  { label: "Review", subtitle: "Confirm & save", icon: CheckCircle2 },
]

/** Loose shape — the live workspace profile fields we read for prefill. */
export interface OnboardingInitial {
  display_name?: string | null
  trades?: string[] | null
  bio?: string | null
  years_experience?: number | null
  base_location?: string | null
  service_radius_km?: number | null
  accepts_emergency?: boolean | null
}

interface Form {
  display_name: string
  years_experience: string
  trades: string
  base_location: string
  service_radius_km: string
  accepts_emergency: boolean
  bio: string
}

export function OnboardingWizard({
  workspaceId,
  initial,
  onClose,
  onSaved,
}: {
  workspaceId: string | null
  initial: OnboardingInitial | null
  onClose: () => void
  onSaved: () => void
}) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>({
    display_name: initial?.display_name ?? "",
    years_experience: initial?.years_experience != null ? String(initial.years_experience) : "",
    trades: (initial?.trades ?? []).join(", "),
    base_location: initial?.base_location ?? "",
    service_radius_km: initial?.service_radius_km != null ? String(initial.service_radius_km) : "",
    accepts_emergency: initial?.accepts_emergency ?? false,
    bio: initial?.bio ?? "",
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof Form>(k: K, v: Form[K]) { setForm((f) => ({ ...f, [k]: v })) }

  const canContinue = useMemo(() => {
    if (step === 0) return form.display_name.trim().length > 0
    return true
  }, [step, form])

  const tradesArr = useMemo(
    () => form.trades.split(",").map((c) => c.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean),
    [form.trades]
  )

  async function finish() {
    if (!workspaceId) { setError("Workspace not ready — retry in a moment."); return }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          display_name: form.display_name.trim(),
          trades: tradesArr,
          bio: form.bio || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          base_location: form.base_location || null,
          service_radius_km: form.service_radius_km ? Number(form.service_radius_km) : null,
          accepts_emergency: form.accepts_emergency,
        }),
      })
      if (!res.ok) { setError("Couldn't save your profile. Please try again."); return }
      onSaved()
      onClose()
    } catch {
      setError("Network error — please try again.")
    } finally {
      setBusy(false)
    }
  }

  const livePanel = (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your profile</p>
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">{form.display_name || "Your business"}</p>
        {form.base_location && <p className="text-xs text-slate-400 mt-0.5">{form.base_location}{form.service_radius_km ? ` · ${form.service_radius_km}km radius` : ""}</p>}
        {form.bio && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{form.bio}</p>}
        {tradesArr.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tradesArr.map((c) => <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{humaniseStatus(c)}</span>)}
          </div>
        )}
        {form.accepts_emergency && <p className="text-[11px] font-semibold text-amber-600 mt-2">⚡ Accepts emergency call-outs</p>}
      </div>
      <p className="text-[11px] text-slate-400">You can refine every field later from your Profile page.</p>
    </div>
  )

  return (
    <SupplierWizardShell
      title="Supplier setup"
      steps={STEPS}
      current={step}
      onStepSelect={setStep}
      onClose={onClose}
      onPrev={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
      onFinish={finish}
      canContinue={canContinue}
      finishing={busy}
      finishLabel="Save profile"
      livePanel={livePanel}
    >
      {error && <div className="mb-4"><SupplierBanner tone="red" onDismiss={() => setError(null)}>{error}</SupplierBanner></div>}

      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your business</h2>
            <p className="text-sm text-slate-500 mt-1">How property managers find and recognise you.</p>
          </div>
          <SupplierField label="Display name" required>
            <input className={supplierInputClass} value={form.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="e.g. Thomas & Co Plumbing" autoFocus />
          </SupplierField>
          <SupplierField label="Years of experience">
            <input className={supplierInputClass} inputMode="numeric" value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} placeholder="e.g. 8" />
          </SupplierField>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">What trades do you cover?</h2>
            <p className="text-sm text-slate-500 mt-1">Comma-separate your trades — these drive lead matching.</p>
          </div>
          <SupplierField label="Trades" hint="e.g. plumbing, electrical, gas safety">
            <input className={supplierInputClass} value={form.trades} onChange={(e) => set("trades", e.target.value)} placeholder="plumbing, electrical, …" />
          </SupplierField>
          {tradesArr.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tradesArr.map((c) => <span key={c} className="text-xs font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-700">{humaniseStatus(c)}</span>)}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Where do you work?</h2>
            <p className="text-sm text-slate-500 mt-1">Your base and how far you'll travel.</p>
          </div>
          <SupplierField label="Base location" hint="Town, city or postcode district.">
            <input className={supplierInputClass} value={form.base_location} onChange={(e) => set("base_location", e.target.value)} placeholder="e.g. Manchester" />
          </SupplierField>
          <SupplierField label="Service radius (km)">
            <input className={supplierInputClass} inputMode="numeric" value={form.service_radius_km} onChange={(e) => set("service_radius_km", e.target.value)} placeholder="e.g. 25" />
          </SupplierField>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.accepts_emergency} onChange={(e) => set("accepts_emergency", e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]/30" />
            <span className="text-sm font-medium text-slate-700">I accept emergency call-outs</span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tell your story</h2>
            <p className="text-sm text-slate-500 mt-1">A bio for your public profile.</p>
          </div>
          <SupplierField label="About">
            <textarea className={supplierTextareaClass} rows={6} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Your experience, specialisms and what sets you apart…" />
          </SupplierField>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Review & save</h2>
            <p className="text-sm text-slate-500 mt-1">Save to publish these details to your profile.</p>
          </div>
          <dl className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            <ReviewRow label="Display name" value={form.display_name || "—"} />
            <ReviewRow label="Experience" value={form.years_experience ? `${form.years_experience} years` : "—"} />
            <ReviewRow label="Trades" value={tradesArr.length ? tradesArr.map(humaniseStatus).join(", ") : "—"} />
            <ReviewRow label="Base" value={form.base_location || "—"} />
            <ReviewRow label="Radius" value={form.service_radius_km ? `${form.service_radius_km} km` : "—"} />
            <ReviewRow label="Emergency" value={form.accepts_emergency ? "Yes" : "No"} />
          </dl>
        </div>
      )}
    </SupplierWizardShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-slate-800 text-right">{value}</dd>
    </div>
  )
}
