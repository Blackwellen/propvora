"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  SupplierButton,
  SupplierField,
  SupplierBanner,
  SupplierCard,
  SupplierEmptyState,
  supplierInputClass,
  supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { ArrowLeft, ArrowRight, Check, MapPin, Store, Upload, X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoverageArea {
  id: string
  label: string
  postcode: string | null
  city: string | null
  region: string | null
  emergency: boolean | null
}

interface WizardState {
  // Step 1
  transaction_type: string
  category: string
  // Step 2
  title: string
  description: string
  // Step 3
  pricing_model: string
  base_price_pounds: string
  currency: string
  // Step 4 - media
  coverFile: File | null
  coverPreview: string | null
  galleryFiles: File[]
  galleryPreviews: string[]
  // Step 5 coverage - informational
  // Step 6 review
}

const TRANSACTION_TYPES = [
  { value: "supplier_job",     label: "Supplier Job",      desc: "One-off trade or maintenance job" },
  { value: "service_package",  label: "Service Package",   desc: "Bundled recurring services" },
  { value: "emergency_job",    label: "Emergency Job",     desc: "24/7 emergency call-out" },
]

const CATEGORIES = [
  "Plumbing", "Electrical", "Carpentry", "Cleaning", "Landscaping",
  "Painting & Decorating", "Roofing", "Flooring", "Gas & Heating", "Other",
]

const PRICING_MODELS = [
  { value: "fixed",         label: "Fixed price" },
  { value: "hourly",        label: "Hourly rate" },
  { value: "quote_required",label: "Quote required" },
  { value: "per_unit",      label: "Per unit / item" },
]

const TOTAL_STEPS = 6

function StepDot({ step, current, done }: { step: number; current: number; done: boolean }) {
  const isActive = step === current
  const isPast = done || step < current
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
          isActive ? "bg-[var(--brand)] text-white" : isPast ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
        )}
      >
        {isPast && !isActive ? <Check className="w-4 h-4" /> : step}
      </div>
    </div>
  )
}

function ProgressBar({ current }: { current: number }) {
  const pct = ((current - 1) / (TOTAL_STEPS - 1)) * 100
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <StepDot key={i} step={i + 1} current={current} done={false} />
        ))}
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--brand)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">Step {current} of {TOTAL_STEPS}</p>
    </div>
  )
}

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ state, setState, error }: { state: WizardState; setState: (s: Partial<WizardState>) => void; error?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Category &amp; Type</h2>
        <p className="text-sm text-slate-500">Choose what kind of service you are listing.</p>
      </div>

      {error && <SupplierBanner tone="red" msg={error} />}

      <SupplierField label="Service type">
        <div className="grid gap-3">
          {TRANSACTION_TYPES.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all",
                state.transaction_type === t.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <input
                type="radio"
                name="transaction_type"
                value={t.value}
                checked={state.transaction_type === t.value}
                onChange={(e) => setState({ transaction_type: e.target.value })}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </SupplierField>

      <SupplierField label="Category">
        <select
          className={supplierInputClass}
          value={state.category}
          onChange={(e) => setState({ category: e.target.value })}
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </SupplierField>
    </div>
  )
}

function Step2({ state, setState, error }: { state: WizardState; setState: (s: Partial<WizardState>) => void; error?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Listing Details</h2>
        <p className="text-sm text-slate-500">Describe your service clearly so buyers know what to expect.</p>
      </div>
      {error && <SupplierBanner tone="red" msg={error} />}
      <SupplierField label="Title *">
        <input
          className={supplierInputClass}
          placeholder="e.g. Emergency boiler repair — same day"
          value={state.title}
          onChange={(e) => setState({ title: e.target.value })}
        />
      </SupplierField>
      <SupplierField label="Description">
        <textarea
          className={cn(supplierTextareaClass, "min-h-[120px]")}
          placeholder="Describe the scope, what's included, turnaround time…"
          value={state.description}
          onChange={(e) => setState({ description: e.target.value })}
        />
      </SupplierField>
    </div>
  )
}

function Step3({ state, setState, error }: { state: WizardState; setState: (s: Partial<WizardState>) => void; error?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Pricing</h2>
        <p className="text-sm text-slate-500">Set your base price and model. You can add price tiers later.</p>
      </div>
      {error && <SupplierBanner tone="red" msg={error} />}
      <SupplierField label="Pricing model *">
        <div className="grid grid-cols-2 gap-3">
          {PRICING_MODELS.map((m) => (
            <label
              key={m.value}
              className={cn(
                "flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all text-sm",
                state.pricing_model === m.value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)] font-medium"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              )}
            >
              <input
                type="radio"
                name="pricing_model"
                value={m.value}
                checked={state.pricing_model === m.value}
                onChange={(e) => setState({ pricing_model: e.target.value })}
                className="accent-[var(--brand)]"
              />
              {m.label}
            </label>
          ))}
        </div>
      </SupplierField>
      <div className="grid grid-cols-2 gap-4">
        <SupplierField label="Base Price (£)">
          <input
            type="number"
            min="0"
            step="0.01"
            className={supplierInputClass}
            placeholder="0.00"
            value={state.base_price_pounds}
            onChange={(e) => setState({ base_price_pounds: e.target.value })}
          />
        </SupplierField>
        <SupplierField label="Currency">
          <select
            className={supplierInputClass}
            value={state.currency}
            onChange={(e) => setState({ currency: e.target.value })}
          >
            <option value="GBP">GBP (£)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </SupplierField>
      </div>
    </div>
  )
}

function Step4({ state, setState }: { state: WizardState; setState: (s: Partial<WizardState>) => void }) {
  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setState({ coverFile: file, coverPreview: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const newPreviews: string[] = []
    let loaded = 0
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        newPreviews.push(reader.result as string)
        loaded++
        if (loaded === files.length) {
          setState({
            galleryFiles: [...state.galleryFiles, ...files],
            galleryPreviews: [...state.galleryPreviews, ...newPreviews],
          })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function removeGallery(idx: number) {
    setState({
      galleryFiles: state.galleryFiles.filter((_, i) => i !== idx),
      galleryPreviews: state.galleryPreviews.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Media</h2>
        <p className="text-sm text-slate-500">Add a cover image and gallery photos to attract buyers.</p>
      </div>

      {/* Cover image */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Cover image</p>
        {state.coverPreview ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setState({ coverFile: null, coverPreview: null })}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-slate-600 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)]/50 transition-colors">
            <input type="file" accept="image/*" className="sr-only" onChange={handleCover} />
            <Upload className="w-8 h-8 text-slate-300" />
            <span className="text-sm text-slate-500">Click to upload cover image</span>
          </label>
        )}
      </div>

      {/* Gallery */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Gallery images</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
          {state.galleryPreviews.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeGallery(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)]/50 transition-colors">
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleGallery} />
            <Upload className="w-5 h-5 text-slate-300 mb-1" />
            <span className="text-[10px] text-slate-400">Add</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function Step5({ coverageAreas }: { coverageAreas: CoverageArea[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Coverage</h2>
        <p className="text-sm text-slate-500">
          Your listing will be available in your workspace coverage areas. Coverage is managed centrally.
        </p>
      </div>
      {coverageAreas.length === 0 ? (
        <SupplierEmptyState
          icon={<MapPin className="w-10 h-10" />}
          title="No coverage areas set"
          description="You haven't added any coverage areas yet. Your listing will still publish, but buyers won't see an area filter."
          action={
            <Link href="/supplier/coverage" target="_blank">
              <SupplierButton variant="outline" size="sm">
                <MapPin className="w-4 h-4" /> Manage coverage areas
              </SupplierButton>
            </Link>
          }
        />
      ) : (
        <div>
          <p className="text-sm text-slate-600 mb-3">
            This listing will be discoverable in these {coverageAreas.length} coverage area{coverageAreas.length !== 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {coverageAreas.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {a.label}
                {a.emergency && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded-full">24/7</span>
                )}
              </span>
            ))}
          </div>
          <Link href="/supplier/coverage" target="_blank" className="inline-block mt-3 text-sm text-[var(--brand)] hover:underline">
            Manage coverage areas →
          </Link>
        </div>
      )}
    </div>
  )
}

function Step6({ state }: { state: WizardState }) {
  const rows: [string, string][] = [
    ["Type",          state.transaction_type.replace(/_/g, " ")],
    ["Category",      state.category || "—"],
    ["Title",         state.title || "—"],
    ["Pricing model", state.pricing_model.replace(/_/g, " ")],
    ["Base price",    state.base_price_pounds ? `£${parseFloat(state.base_price_pounds).toFixed(2)}` : "—"],
    ["Currency",      state.currency],
    ["Cover image",   state.coverPreview ? "Uploaded" : "None"],
    ["Gallery",       state.galleryPreviews.length > 0 ? `${state.galleryPreviews.length} image(s)` : "None"],
  ]
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Review &amp; Submit</h2>
        <p className="text-sm text-slate-500">
          Check your listing details. Once submitted it will be reviewed before going live.
        </p>
      </div>
      <SupplierCard className="overflow-hidden">
        <div className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center gap-4 px-5 py-3">
              <span className="text-sm text-slate-500 w-36 shrink-0">{label}</span>
              <span className="text-sm font-medium text-slate-900 capitalize">{value}</span>
            </div>
          ))}
        </div>
      </SupplierCard>
      {state.coverPreview && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Cover preview</p>
          <div className="w-40 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.coverPreview} alt="Cover" className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const INITIAL_STATE: WizardState = {
  transaction_type: "",
  category: "",
  title: "",
  description: "",
  pricing_model: "fixed",
  base_price_pounds: "",
  currency: "GBP",
  coverFile: null,
  coverPreview: null,
  galleryFiles: [],
  galleryPreviews: [],
}

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, _setState] = useState<WizardState>(INITIAL_STATE)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  function setState(patch: Partial<WizardState>) {
    _setState((prev) => ({ ...prev, ...patch }))
    setStepError(null)
  }

  useEffect(() => {
    let active = true
    const supabase = createClient()
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !active) return
        const { data: member } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle()
        if (!active) return
        const wsId = member?.workspace_id ?? null
        setWorkspaceId(wsId)
        if (wsId) {
          const { data: ca } = await supabase
            .from("coverage_areas")
            .select("id, label, postcode, city, region, emergency")
            .eq("workspace_id", wsId)
          setCoverageAreas((ca ?? []) as CoverageArea[])
        }
      } catch {
        // ignore
      }
    })()
    return () => { active = false }
  }, [])

  function validate(): boolean {
    if (step === 1) {
      if (!state.transaction_type) { setStepError("Please select a service type"); return false }
      if (!state.category) { setStepError("Please select a category"); return false }
    }
    if (step === 2) {
      if (!state.title.trim()) { setStepError("A title is required"); return false }
    }
    if (step === 3) {
      if (!state.pricing_model) { setStepError("Please select a pricing model"); return false }
    }
    return true
  }

  function handleNext() {
    if (!validate()) return
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  function handleBack() {
    setStepError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!workspaceId) { setSubmitError("No workspace found. Please sign in again."); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Insert listing
      const { data: listing, error: lErr } = await supabase
        .from("marketplace_listings")
        .insert({
          workspace_id: workspaceId,
          title: state.title.trim(),
          description: state.description.trim() || null,
          transaction_type: state.transaction_type,
          category: state.category || null,
          pricing_model: state.pricing_model,
          base_price_pence: state.base_price_pounds
            ? Math.round(parseFloat(state.base_price_pounds) * 100)
            : null,
          currency: state.currency,
          status: "pending_review",
          created_by: user.id,
        })
        .select()
        .single()

      if (lErr) throw lErr

      // Insert media
      const mediaToInsert: { listing_id: string; url: string; kind: string; sort_order: number; r2_key: string }[] = []

      if (state.coverPreview) {
        mediaToInsert.push({
          listing_id: listing.id,
          url: state.coverPreview,
          kind: "cover",
          sort_order: 0,
          r2_key: "",
        })
      }
      state.galleryPreviews.forEach((url, i) => {
        mediaToInsert.push({
          listing_id: listing.id,
          url,
          kind: "gallery",
          sort_order: i + 1,
          r2_key: "",
        })
      })

      if (mediaToInsert.length > 0) {
        const { error: mErr } = await supabase
          .from("marketplace_listing_media")
          .insert(mediaToInsert)
        if (mErr) throw mErr
      }

      router.push("/supplier/marketplace")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit listing")
    } finally {
      setSubmitting(false)
    }
  }

  const STEP_LABELS = ["Type", "Details", "Pricing", "Media", "Coverage", "Review"]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/supplier/marketplace">
          <button className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">New Listing</h1>
      </div>

      <ProgressBar current={step} />

      <div className="min-h-[340px]">
        {step === 1 && <Step1 state={state} setState={setState} error={stepError ?? undefined} />}
        {step === 2 && <Step2 state={state} setState={setState} error={stepError ?? undefined} />}
        {step === 3 && <Step3 state={state} setState={setState} error={stepError ?? undefined} />}
        {step === 4 && <Step4 state={state} setState={setState} />}
        {step === 5 && <Step5 coverageAreas={coverageAreas} />}
        {step === 6 && <Step6 state={state} />}
      </div>

      {submitError && (
        <div className="mt-4">
          <SupplierBanner tone="red" msg={submitError} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
        <SupplierButton variant="outline" onClick={handleBack} disabled={step === 1}>
          <ArrowLeft className="w-4 h-4" /> Back
        </SupplierButton>

        <span className="text-sm text-slate-400">{STEP_LABELS[step - 1]}</span>

        {step < TOTAL_STEPS ? (
          <SupplierButton onClick={handleNext}>
            Next <ArrowRight className="w-4 h-4" />
          </SupplierButton>
        ) : (
          <SupplierButton onClick={handleSubmit} loading={submitting}>
            <Store className="w-4 h-4" /> Submit for review
          </SupplierButton>
        )}
      </div>
    </div>
  )
}
