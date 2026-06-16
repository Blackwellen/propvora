"use client"

import { useCallback, useReducer, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft, ChevronRight, Check, Upload, X, Plus, Store, Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierCard,
  SupplierButton,
  SupplierField,
  SupplierBanner,
  supplierInputClass,
  supplierTextareaClass,
} from "@/components/supplier-workspace/ui"
import { useSupplierWorkspace } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { moneyPence } from "@/components/supplier-workspace/format"
import { CATEGORIES } from "@/components/marketplace"

/* ──────────────────────────────────────────────────────────────────────────
   12-step Supplier Listing Creation Wizard
   Constraints: no dark: classes, no hardcoded data, Supabase via /api.
─────────────────────────────────────────────────────────────────────────── */

const LISTING_TYPES = [
  { value: "one_off", label: "One-off service", description: "A single visit or job — quoted per engagement." },
  { value: "recurring", label: "Recurring service", description: "Regular schedule: weekly, monthly, quarterly." },
  { value: "package", label: "Package", description: "A fixed bundle of deliverables at a set price." },
]

const PRICING_MODELS = [
  { value: "per_job", label: "Per job", description: "A single price for the whole job." },
  { value: "per_hour", label: "Per hour", description: "Charged at an hourly rate." },
  { value: "per_day", label: "Per day", description: "Charged per day on site." },
  { value: "fixed", label: "Fixed price", description: "A fixed quote agreed before work starts." },
]

const CANCELLATION_POLICIES = [
  { value: "flexible", label: "Flexible", description: "Full refund up to 24 hours before." },
  { value: "moderate", label: "Moderate", description: "50% refund up to 48 hours before." },
  { value: "strict", label: "Strict", description: "No refund after booking." },
]

const STEP_LABELS = [
  "Category",
  "Listing type",
  "Title & tagline",
  "Description",
  "Key features",
  "Pricing model",
  "Price tiers",
  "Coverage",
  "Availability",
  "Media",
  "Policies",
  "Review & submit",
]

type DaySchedule = { enabled: boolean; start: string; end: string }
type PriceTier = { label: string; price_pence: number }

interface WizardState {
  // Step 1
  category: string
  // Step 2
  listingType: string
  // Step 3
  title: string
  tagline: string
  // Step 4
  description: string
  // Step 5
  keyFeatures: string[]
  // Step 6
  pricingModel: string
  basePricePence: string
  currency: string
  // Step 7
  priceTiers: PriceTier[]
  // Step 8 (coverage inherited from workspace)
  coverageNote: string
  // Step 9
  availability: Record<string, DaySchedule>
  // Step 10
  mediaFiles: File[]
  mediaPreviews: string[]
  // Step 11
  cancellationPolicy: string
  termsIncluded: string
  termsExcluded: string
  responseTimeHours: string
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DEFAULT_DAY: DaySchedule = { enabled: false, start: "09:00", end: "17:00" }

function makeDefaultState(params: URLSearchParams): WizardState {
  return {
    category: params.get("template") ?? "",
    listingType: "one_off",
    title: params.get("title") ?? "",
    tagline: "",
    description: "",
    keyFeatures: [],
    pricingModel: "per_job",
    basePricePence: "",
    currency: "GBP",
    priceTiers: [],
    coverageNote: "",
    availability: Object.fromEntries(DAYS.map((d) => [d, { ...DEFAULT_DAY }])),
    mediaFiles: [],
    mediaPreviews: [],
    cancellationPolicy: "flexible",
    termsIncluded: "",
    termsExcluded: "",
    responseTimeHours: "24",
  }
}

type WizardAction = { type: "set"; field: keyof WizardState; value: WizardState[keyof WizardState] }
function reducer(state: WizardState, action: WizardAction): WizardState {
  return { ...state, [action.field]: action.value }
}

export default function NewListingWizardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { workspaceId } = useSupplierWorkspace()

  const [step, setStep] = useState(1)
  const [state, dispatch] = useReducer(reducer, undefined, () => makeDefaultState(searchParams))
  const [banner, setBanner] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof WizardState>(field: K, value: WizardState[K]) {
    dispatch({ type: "set", field, value: value as WizardState[keyof WizardState] })
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return Boolean(state.category)
      case 2: return Boolean(state.listingType)
      case 3: return state.title.trim().length > 2
      case 4: return state.description.trim().length > 10
      case 5: return true // features optional
      case 6: return Boolean(state.pricingModel) && Boolean(state.basePricePence)
      case 7: return true // tiers optional
      case 8: return true // coverage from workspace
      case 9: return true // availability optional
      case 10: return state.mediaFiles.length > 0
      case 11: return Boolean(state.cancellationPolicy)
      case 12: return true
      default: return true
    }
  }

  function next() {
    if (!canProceed()) { setBanner("Please complete this step before continuing."); return }
    setBanner(null)
    setStep((s) => Math.min(s + 1, 12))
  }

  function back() {
    setBanner(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  function addMediaFile(file: File) {
    const url = URL.createObjectURL(file)
    set("mediaFiles", [...state.mediaFiles, file])
    set("mediaPreviews", [...state.mediaPreviews, url])
  }

  function removeMedia(i: number) {
    const files = state.mediaFiles.filter((_, j) => j !== i)
    const previews = state.mediaPreviews.filter((_, j) => j !== i)
    set("mediaFiles", files)
    set("mediaPreviews", previews)
  }

  const submit = useCallback(async () => {
    if (!workspaceId) { setBanner("Workspace not ready."); return }
    setSubmitting(true); setBanner(null)
    try {
      // 1. Create the listing
      const body = {
        workspaceId,
        title: state.title.trim(),
        description: state.description.trim() || null,
        category: state.category,
        listing_type: state.listingType,
        pricing_model: state.pricingModel,
        base_price_pence: state.basePricePence ? parseInt(state.basePricePence, 10) : null,
        currency: state.currency,
        usp: state.tagline.trim() || null,
        key_features: state.keyFeatures.length ? state.keyFeatures : null,
        price_tiers: state.priceTiers.length ? state.priceTiers : null,
        cancellation_policy: state.cancellationPolicy,
        terms_included: state.termsIncluded.trim() || null,
        terms_excluded: state.termsExcluded.trim() || null,
        response_time_hours: state.responseTimeHours ? parseInt(state.responseTimeHours, 10) : null,
        availability_schedule: state.availability,
        status: "pending_review",
      }

      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => null)
        setBanner((j as { error?: string } | null)?.error ?? "Couldn't create listing.")
        setSubmitting(false)
        return
      }

      const created = await res.json()
      const listingId: string = (created.listing as { id?: string } | null)?.id ?? ""
      setCreatedId(listingId)

      // 2. Upload media if any
      if (state.mediaFiles.length > 0 && listingId) {
        for (const file of state.mediaFiles) {
          try {
            const form = new FormData()
            form.append("file", file)
            form.append("workspaceId", workspaceId)
            form.append("folder", `marketplace/${listingId}/media`)
            const up = await fetch("/api/upload", { method: "POST", body: form })
            if (up.ok) {
              const meta = await up.json()
              await fetch(`/api/marketplace/listings/${listingId}/media`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ r2Key: meta.key, url: meta.url, isCover: false }),
              })
            }
          } catch {
            // non-fatal — listing exists, media can be added later
          }
        }
      }

      setStep(13) // success
    } catch {
      setBanner("Network error — please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [workspaceId, state])

  // ── Success screen ──────────────────────────────────────────────────────

  if (step === 13) {
    return (
      <div className="space-y-5">
        <MobileTopBar title="Listing submitted" subtitle="" />
        <SupplierCard className="p-8 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Listing submitted for review</h2>
          <p className="mt-2 text-sm text-slate-500 text-pretty">
            Your listing has been submitted and is pending review by the Propvora team. You&apos;ll be notified once it&apos;s approved and goes live.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {createdId && (
              <Link
                href={`/supplier/marketplace/${createdId}`}
                className="inline-flex items-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
              >
                View listing <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              href="/supplier/marketplace"
              className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
            >
              Back to listings
            </Link>
          </div>
        </SupplierCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <MobileTopBar
        title={`Step ${step}: ${STEP_LABELS[step - 1]}`}
        subtitle="New listing"
        showBack
        backHref="/supplier/marketplace"
      />

      {/* Desktop header */}
      <div className="hidden md:flex items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-1.5">
            <Link href="/supplier/marketplace" className="hover:text-slate-600 inline-flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Marketplace
            </Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">New listing</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Create a listing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Step {step} of 12 — {STEP_LABELS[step - 1]}</p>
        </div>
        <SupplierButton variant="ghost" size="sm" onClick={() => router.push("/supplier/marketplace")}>
          <X className="w-4 h-4" /> Cancel
        </SupplierButton>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#2563EB] rounded-full transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${(step / 12) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={n} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { if (done) setStep(n) }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-colors",
                  active ? "bg-[#0D1B2A] text-white"
                    : done ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                    : "text-slate-400 cursor-default"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  active ? "bg-white text-[#0D1B2A]"
                    : done ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                )}>
                  {done ? <Check className="w-2.5 h-2.5" /> : n}
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </button>
              {i < STEP_LABELS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-200 shrink-0" />}
            </div>
          )
        })}
      </div>

      {banner && (
        <SupplierBanner tone="amber" onDismiss={() => setBanner(null)}>{banner}</SupplierBanner>
      )}

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 1 && <Step1Category value={state.category} onChange={(v) => set("category", v)} />}
        {step === 2 && <Step2Type value={state.listingType} onChange={(v) => set("listingType", v)} />}
        {step === 3 && (
          <Step3Title
            title={state.title}
            tagline={state.tagline}
            onTitle={(v) => set("title", v)}
            onTagline={(v) => set("tagline", v)}
          />
        )}
        {step === 4 && (
          <Step4Description value={state.description} onChange={(v) => set("description", v)} />
        )}
        {step === 5 && (
          <Step5Features
            features={state.keyFeatures}
            onChange={(v) => set("keyFeatures", v)}
          />
        )}
        {step === 6 && (
          <Step6Pricing
            model={state.pricingModel}
            price={state.basePricePence}
            currency={state.currency}
            onModel={(v) => set("pricingModel", v)}
            onPrice={(v) => set("basePricePence", v)}
            onCurrency={(v) => set("currency", v)}
          />
        )}
        {step === 7 && (
          <Step7Tiers
            tiers={state.priceTiers}
            onChange={(v) => set("priceTiers", v)}
          />
        )}
        {step === 8 && <Step8Coverage workspaceId={workspaceId} />}
        {step === 9 && (
          <Step9Availability
            schedule={state.availability}
            onChange={(v) => set("availability", v)}
          />
        )}
        {step === 10 && (
          <Step10Media
            previews={state.mediaPreviews}
            fileInputRef={fileInputRef}
            onAdd={addMediaFile}
            onRemove={removeMedia}
          />
        )}
        {step === 11 && (
          <Step11Policies
            cancellationPolicy={state.cancellationPolicy}
            termsIncluded={state.termsIncluded}
            termsExcluded={state.termsExcluded}
            responseTimeHours={state.responseTimeHours}
            onCancellation={(v) => set("cancellationPolicy", v)}
            onIncluded={(v) => set("termsIncluded", v)}
            onExcluded={(v) => set("termsExcluded", v)}
            onResponseTime={(v) => set("responseTimeHours", v)}
          />
        )}
        {step === 12 && (
          <Step12Review
            state={state}
            onSubmit={submit}
            submitting={submitting}
          />
        )}
      </div>

      {/* Navigation */}
      {step < 12 && (
        <div className="flex items-center justify-between pt-2">
          <SupplierButton variant="secondary" size="sm" onClick={back} disabled={step === 1}>
            <ChevronLeft className="w-4 h-4" /> Back
          </SupplierButton>
          <span className="text-xs text-slate-400">{step} / 12</span>
          <SupplierButton size="sm" onClick={next}>
            Next <ChevronRight className="w-4 h-4" />
          </SupplierButton>
        </div>
      )}
      {step === 12 && (
        <div className="flex items-center justify-between pt-2">
          <SupplierButton variant="secondary" size="sm" onClick={back}>
            <ChevronLeft className="w-4 h-4" /> Back
          </SupplierButton>
          <SupplierButton size="sm" onClick={() => void submit()} loading={submitting}>
            Submit for review <ChevronRight className="w-4 h-4" />
          </SupplierButton>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 1 — Category
══════════════════════════════════════════════════════════════════════════ */

function Step1Category({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">What service category?</h2>
      <p className="text-sm text-slate-500 mb-5">Choose the primary category. This controls how buyers find your listing.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((c) => {
          const CIcon = c.icon
          const active = value === c.key
          return (
            <button
              key={c.key}
              onClick={() => onChange(c.key)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                active
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
                <CIcon className={cn("w-5 h-5", c.color)} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", active ? "text-[#2563EB]" : "text-slate-900")}>{c.label}</p>
              </div>
              {active && <Check className="w-4 h-4 text-[#2563EB] ml-auto shrink-0" />}
            </button>
          )
        })}
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 2 — Listing type
══════════════════════════════════════════════════════════════════════════ */

function Step2Type({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">What type of listing?</h2>
      <p className="text-sm text-slate-500 mb-5">This shapes how buyers book and pay for your service.</p>
      <div className="space-y-3">
        {LISTING_TYPES.map((t) => {
          const active = value === t.value
          return (
            <button
              key={t.value}
              onClick={() => onChange(t.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                active ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div>
                <p className={cn("text-sm font-bold", active ? "text-[#2563EB]" : "text-slate-900")}>{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
              </div>
              {active && <Check className="w-4 h-4 text-[#2563EB] ml-auto shrink-0" />}
            </button>
          )
        })}
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 3 — Title + tagline
══════════════════════════════════════════════════════════════════════════ */

function Step3Title({
  title, tagline, onTitle, onTagline,
}: { title: string; tagline: string; onTitle: (v: string) => void; onTagline: (v: string) => void }) {
  return (
    <SupplierCard className="p-5 space-y-4 max-w-xl">
      <h2 className="text-base font-semibold text-slate-900">Give your listing a name</h2>
      <SupplierField label="Listing title" required hint="Be specific — &ldquo;Emergency Boiler Repair London&rdquo; outperforms &ldquo;Plumbing Service&rdquo;.">
        <input
          className={supplierInputClass}
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="e.g. Professional Residential Deep Clean"
          maxLength={120}
        />
        <span className="text-[11px] text-slate-400">{title.length}/120</span>
      </SupplierField>
      <SupplierField label="Tagline" hint="One sentence — shown on the listing card. Optional but recommended.">
        <input
          className={supplierInputClass}
          value={tagline}
          onChange={(e) => onTagline(e.target.value)}
          placeholder="e.g. Same-day service guaranteed across Greater London"
          maxLength={160}
        />
      </SupplierField>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 4 — Description
══════════════════════════════════════════════════════════════════════════ */

function Step4Description({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <SupplierCard className="p-5 max-w-xl space-y-3">
      <h2 className="text-base font-semibold text-slate-900">Describe your service</h2>
      <p className="text-sm text-slate-500">
        What&apos;s included, who it&apos;s for, and what makes you different. Buyers read this before enquiring — be honest and specific.
      </p>
      <SupplierField label="Description" required hint="Aim for 100–400 words.">
        <textarea
          className={supplierTextareaClass}
          rows={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tell buyers exactly what they get, how you work, and any requirements or access you&apos;ll need…"
        />
        <span className="text-[11px] text-slate-400">{value.length} characters</span>
      </SupplierField>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 5 — Key features
══════════════════════════════════════════════════════════════════════════ */

function Step5Features({ features, onChange }: { features: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("")

  function add() {
    if (!input.trim() || features.length >= 8) return
    onChange([...features, input.trim()])
    setInput("")
  }

  return (
    <SupplierCard className="p-5 max-w-xl">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Key features</h2>
      <p className="text-sm text-slate-500 mb-4">Up to 8 bullet points displayed on your listing. These are the first things buyers read. Optional but highly recommended.</p>

      <ul className="space-y-2 mb-4">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="flex-1 text-sm text-slate-700">{f}</span>
            <button onClick={() => onChange(features.filter((_, j) => j !== i))} className="p-1 text-slate-300 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
        {features.length === 0 && (
          <li className="text-sm text-slate-400 py-1">No features added yet.</li>
        )}
      </ul>

      {features.length < 8 && (
        <div className="flex items-center gap-2">
          <input
            className={`${supplierInputClass} flex-1`}
            placeholder="e.g. Includes labour and materials up to £50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          />
          <SupplierButton size="sm" variant="secondary" onClick={add} disabled={!input.trim()}>
            <Plus className="w-3.5 h-3.5" /> Add
          </SupplierButton>
        </div>
      )}
      {features.length >= 8 && (
        <p className="text-xs text-slate-400">Maximum 8 features reached.</p>
      )}
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 6 — Pricing model
══════════════════════════════════════════════════════════════════════════ */

function Step6Pricing({
  model, price, currency, onModel, onPrice, onCurrency,
}: {
  model: string; price: string; currency: string
  onModel: (v: string) => void; onPrice: (v: string) => void; onCurrency: (v: string) => void
}) {
  return (
    <div className="space-y-4 max-w-xl">
      <SupplierCard className="p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-4">How do you charge?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {PRICING_MODELS.map((m) => {
            const active = model === m.value
            return (
              <button
                key={m.value}
                onClick={() => onModel(m.value)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all",
                  active ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <p className={cn("text-sm font-bold", active ? "text-[#2563EB]" : "text-slate-900")}>{m.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SupplierField label="Base price (pence)" required hint="e.g. £150 = 15000p">
            <input
              type="number"
              className={supplierInputClass}
              value={price}
              onChange={(e) => onPrice(e.target.value)}
              min={0}
              step={100}
              placeholder="15000"
            />
            {price && !isNaN(parseInt(price, 10)) && (
              <p className="text-xs text-slate-400 mt-1">= {moneyPence(parseInt(price, 10), currency)}</p>
            )}
          </SupplierField>
          <SupplierField label="Currency">
            <select className={supplierInputClass} value={currency} onChange={(e) => onCurrency(e.target.value)}>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
              <option value="AUD">AUD</option>
            </select>
          </SupplierField>
        </div>
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 7 — Price tiers (optional)
══════════════════════════════════════════════════════════════════════════ */

function Step7Tiers({ tiers, onChange }: { tiers: PriceTier[]; onChange: (v: PriceTier[]) => void }) {
  const [label, setLabel] = useState("")
  const [price, setPrice] = useState("")

  function add() {
    if (!label.trim() || !price) return
    onChange([...tiers, { label: label.trim(), price_pence: parseInt(price, 10) }])
    setLabel(""); setPrice("")
  }

  return (
    <SupplierCard className="p-5 max-w-xl">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Price tiers</h2>
      <p className="text-sm text-slate-500 mb-4">Optional. Create tiered pricing shown on the listing — e.g. &ldquo;Up to 3 hours = £150, 3–6 hours = £250&rdquo;.</p>

      <div className="space-y-2 mb-4">
        {tiers.map((t, i) => (
          <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3.5 py-2.5">
            <span className="flex-1 text-sm text-slate-700">{t.label}</span>
            <span className="text-sm font-semibold text-slate-900">{moneyPence(t.price_pence)}</span>
            <button onClick={() => onChange(tiers.filter((_, j) => j !== i))} className="p-1 text-slate-300 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {tiers.length === 0 && (
          <p className="text-sm text-slate-400">No tiers added. Buyers will only see the base price.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          className={`${supplierInputClass} flex-1`}
          placeholder="Label (e.g. Up to 3 hours)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <input
          type="number"
          className="h-10 w-24 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
          placeholder="Pence"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <SupplierButton size="sm" variant="secondary" onClick={add} disabled={!label.trim() || !price}>
          <Plus className="w-3.5 h-3.5" />
        </SupplierButton>
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 8 — Coverage (from workspace)
══════════════════════════════════════════════════════════════════════════ */

function Step8Coverage({ workspaceId }: { workspaceId: string | null }) {
  return (
    <SupplierCard className="p-5 max-w-xl">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Coverage areas</h2>
      <p className="text-sm text-slate-500 mb-4">
        Your listing inherits the coverage areas defined in your workspace settings. This tells buyers where you can deliver the service.
      </p>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
        <p className="text-sm text-[#2563EB] font-semibold">Coverage is workspace-wide</p>
        <p className="text-xs text-slate-500 mt-1">
          All your listings share your workspace&apos;s coverage areas. Manage them from the Coverage section.
        </p>
      </div>
      <Link
        href="/supplier/coverage"
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8]"
      >
        Manage coverage areas <ChevronRight className="w-4 h-4" />
      </Link>
      <p className="mt-3 text-xs text-slate-400">{workspaceId ? "Workspace loaded." : "Loading workspace…"}</p>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 9 — Availability
══════════════════════════════════════════════════════════════════════════ */

function Step9Availability({
  schedule, onChange,
}: {
  schedule: Record<string, DaySchedule>
  onChange: (v: Record<string, DaySchedule>) => void
}) {
  function update(day: string, field: keyof DaySchedule, value: string | boolean) {
    onChange({ ...schedule, [day]: { ...schedule[day], [field]: value } })
  }

  return (
    <SupplierCard className="p-5 max-w-xl">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Service hours</h2>
      <p className="text-sm text-slate-500 mb-4">When are you available to deliver this service? Optional — skip if flexible.</p>
      <div className="space-y-2">
        {DAYS.map((day) => {
          const cfg = schedule[day] ?? DEFAULT_DAY
          return (
            <div key={day} className={cn("flex items-center gap-3 rounded-xl px-3.5 py-2.5 border", cfg.enabled ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100")}>
              <input
                type="checkbox"
                id={`new-day-${day}`}
                checked={cfg.enabled}
                onChange={(e) => update(day, "enabled", e.target.checked)}
                className="w-4 h-4 accent-[#2563EB]"
              />
              <label htmlFor={`new-day-${day}`} className={cn("w-20 text-sm font-semibold", cfg.enabled ? "text-[#2563EB]" : "text-slate-500")}>
                {day.slice(0, 3)}
              </label>
              {cfg.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={cfg.start} onChange={(e) => update(day, "start", e.target.value)} className="h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white" />
                  <span className="text-slate-400 text-sm">–</span>
                  <input type="time" value={cfg.end} onChange={(e) => update(day, "end", e.target.value)} className="h-8 px-2 rounded-lg border border-slate-200 text-sm bg-white" />
                </div>
              ) : (
                <span className="text-sm text-slate-400 flex-1">Unavailable</span>
              )}
            </div>
          )
        })}
      </div>
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 10 — Media
══════════════════════════════════════════════════════════════════════════ */

function Step10Media({
  previews, fileInputRef, onAdd, onRemove,
}: {
  previews: string[]
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAdd: (f: File) => void
  onRemove: (i: number) => void
}) {
  return (
    <SupplierCard className="p-5">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Upload photos</h2>
      <p className="text-sm text-slate-500 mb-4">
        At least one photo is required. Listings with 3+ photos receive significantly more enquiries. The first photo becomes the cover image.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept="image/*"
        onChange={(e) => {
          for (const f of Array.from(e.target.files ?? [])) onAdd(f)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }}
      />

      {previews.length === 0 ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-slate-200 hover:border-[#2563EB] rounded-2xl p-8 text-center transition-colors group"
        >
          <Upload className="w-8 h-8 text-slate-300 group-hover:text-[#2563EB] mx-auto mb-3 transition-colors" />
          <p className="text-sm font-semibold text-slate-600 group-hover:text-[#2563EB] transition-colors">Click to upload photos</p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB each</p>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((url, i) => (
              <div key={i} className={cn("group relative rounded-xl overflow-hidden border bg-slate-50", i === 0 ? "border-[#2563EB]" : "border-slate-200")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Upload ${i + 1}`} className="w-full h-28 object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 bg-[#0D1B2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Cover</span>
                )}
                <button
                  onClick={() => onRemove(i)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-slate-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <SupplierButton size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" /> Add more photos
          </SupplierButton>
        </div>
      )}
    </SupplierCard>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 11 — Policies
══════════════════════════════════════════════════════════════════════════ */

function Step11Policies({
  cancellationPolicy, termsIncluded, termsExcluded, responseTimeHours,
  onCancellation, onIncluded, onExcluded, onResponseTime,
}: {
  cancellationPolicy: string; termsIncluded: string; termsExcluded: string; responseTimeHours: string
  onCancellation: (v: string) => void; onIncluded: (v: string) => void; onExcluded: (v: string) => void; onResponseTime: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Cancellation &amp; response</h2>
        <SupplierField label="Cancellation policy" required>
          <div className="space-y-2">
            {CANCELLATION_POLICIES.map((p) => {
              const active = cancellationPolicy === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => onCancellation(p.value)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                    active ? "border-[#2563EB] bg-[#EFF6FF]" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div>
                    <p className={cn("text-sm font-bold", active ? "text-[#2563EB]" : "text-slate-900")}>{p.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#2563EB] ml-auto mt-0.5 shrink-0" />}
                </button>
              )
            })}
          </div>
        </SupplierField>
        <SupplierField label="Response time commitment (hours)" hint="How quickly do you commit to reply to enquiries?">
          <input
            type="number"
            className={supplierInputClass}
            value={responseTimeHours}
            onChange={(e) => onResponseTime(e.target.value)}
            min={1}
            max={72}
          />
        </SupplierField>
      </SupplierCard>

      <SupplierCard className="p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Scope</h2>
        <SupplierField label="What&apos;s included" hint="Everything the buyer gets.">
          <textarea
            className={supplierTextareaClass}
            rows={3}
            value={termsIncluded}
            onChange={(e) => onIncluded(e.target.value)}
            placeholder="Labour, materials up to £50, before and after photos…"
          />
        </SupplierField>
        <SupplierField label="What&apos;s NOT included" hint="Set expectations clearly.">
          <textarea
            className={supplierTextareaClass}
            rows={3}
            value={termsExcluded}
            onChange={(e) => onExcluded(e.target.value)}
            placeholder="Specialist parts, scaffolding, structural work…"
          />
        </SupplierField>
      </SupplierCard>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STEP 12 — Review + submit
══════════════════════════════════════════════════════════════════════════ */

function Step12Review({
  state, onSubmit, submitting,
}: { state: WizardState; onSubmit: () => Promise<void>; submitting: boolean }) {
  const cat = CATEGORIES.find((c) => c.key === state.category)
  const CatIcon = cat?.icon ?? Tag

  const sections: { label: string; items: [string, string][] }[] = [
    {
      label: "Basic info",
      items: [
        ["Category", cat?.label ?? state.category],
        ["Listing type", LISTING_TYPES.find((t) => t.value === state.listingType)?.label ?? state.listingType],
        ["Title", state.title],
        ["Tagline", state.tagline || "—"],
      ],
    },
    {
      label: "Pricing",
      items: [
        ["Model", PRICING_MODELS.find((m) => m.value === state.pricingModel)?.label ?? state.pricingModel],
        ["Base price", state.basePricePence ? moneyPence(parseInt(state.basePricePence, 10), state.currency) : "—"],
        ["Currency", state.currency],
        ["Price tiers", state.priceTiers.length ? `${state.priceTiers.length} tier${state.priceTiers.length === 1 ? "" : "s"}` : "None"],
      ],
    },
    {
      label: "Policies",
      items: [
        ["Cancellation", CANCELLATION_POLICIES.find((p) => p.value === state.cancellationPolicy)?.label ?? state.cancellationPolicy],
        ["Response time", state.responseTimeHours ? `${state.responseTimeHours}h` : "—"],
      ],
    },
    {
      label: "Content",
      items: [
        ["Description", state.description.length ? `${state.description.length} characters` : "Missing"],
        ["Key features", state.keyFeatures.length ? `${state.keyFeatures.length} feature${state.keyFeatures.length === 1 ? "" : "s"}` : "None"],
        ["Photos", state.mediaFiles.length ? `${state.mediaFiles.length} photo${state.mediaFiles.length === 1 ? "" : "s"}` : "None"],
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <SupplierCard className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", cat?.bg ?? "bg-slate-100")}>
            <CatIcon className={cn("w-7 h-7", cat?.color ?? "text-slate-600")} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{state.title || "Untitled listing"}</h2>
            {state.tagline && <p className="text-sm text-slate-500 mt-0.5">{state.tagline}</p>}
            <div className="flex items-center gap-2 mt-2">
              {cat && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">{cat.label}</span>}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">Pending review after submit</span>
            </div>
          </div>
        </div>
      </SupplierCard>

      {/* Summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <SupplierCard key={s.label} className="p-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400 mb-3">{s.label}</h3>
            <dl className="space-y-2">
              {s.items.map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className={cn("text-sm font-semibold text-right", value === "Missing" ? "text-red-600" : "text-slate-800")}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </SupplierCard>
        ))}
      </div>

      {/* Review notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Store className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Your listing will be reviewed before going live</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Propvora reviews all new listings for quality and accuracy. Approval typically takes 1–2 business days. You&apos;ll receive a notification when it&apos;s approved.
            </p>
          </div>
        </div>
      </div>

      <SupplierButton
        onClick={() => void onSubmit()}
        loading={submitting}
        className="w-full"
      >
        <Check className="w-4 h-4" /> Submit listing for review
      </SupplierButton>
    </div>
  )
}

