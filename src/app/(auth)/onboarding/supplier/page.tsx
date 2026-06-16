"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Wrench,
  MapPin,
  ShieldCheck,
  Star,
  Building2,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { createWorkspace } from "@/lib/actions/workspace"

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffBand = "solo" | "2-5" | "5-20" | "20+"
type RadiusKm = "5" | "10" | "25" | "50" | "100"
type ServiceCount = "1-2" | "3-5" | "5-10" | "10+"

interface SupplierState {
  // Step 1 — trade categories
  tradeCategories: string[]
  // Step 2 — business
  companyName: string
  yearsInBusiness: string
  staffBand: StaffBand | ""
  // Step 3 — service area
  baseLocation: string
  radiusKm: RadiusKm | ""
  acceptEmergency: boolean
  // Step 4 — insurance
  hasPublicLiability: boolean
  insuranceExpiry: string
  // Step 5 — quick wins
  serviceCount: ServiceCount | ""
  listOnMarketplace: boolean | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6

const TRADE_CATEGORIES = [
  "Cleaning",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Landscaping",
  "Security",
  "Painting",
  "Carpentry",
  "Gas Engineer",
  "Locksmith",
  "Other",
]

const STAFF_BANDS: { value: StaffBand; label: string }[] = [
  { value: "solo", label: "Solo (just me)" },
  { value: "2-5", label: "2 – 5 people" },
  { value: "5-20", label: "5 – 20 people" },
  { value: "20+", label: "20+ people" },
]

const RADIUS_OPTIONS: { value: RadiusKm; label: string }[] = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
]

const SERVICE_COUNTS: { value: ServiceCount; label: string }[] = [
  { value: "1-2", label: "1 – 2 services" },
  { value: "3-5", label: "3 – 5 services" },
  { value: "5-10", label: "5 – 10 services" },
  { value: "10+", label: "10+ services" },
]

const PROGRESS_MESSAGES = [
  "Creating your supplier profile…",
  "Setting up your workspace…",
  "Configuring your service area…",
  "Almost ready…",
]

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-6" role="img" aria-label={`Step ${current} of ${total}`}>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-[#2563EB]">Step {current} of {total}</p>
          <p className="text-xs text-slate-400 tabular-nums">{pct}%</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
            <React.Fragment key={step}>
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                  step < current
                    ? "bg-[#2563EB] text-white"
                    : step === current
                    ? "bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {step < current ? <Check className="h-3.5 w-3.5" /> : step}
              </div>
              {step < total && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-all duration-500",
                    step < current ? "bg-[#2563EB]" : "bg-slate-200"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">Step {current} of {total}</p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SupplierOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userName, setUserName] = useState("")
  const [progressIdx, setProgressIdx] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

  const [state, setState] = useState<SupplierState>({
    tradeCategories: [],
    companyName: "",
    yearsInBusiness: "",
    staffBand: "",
    baseLocation: "",
    radiusKm: "",
    acceptEmergency: false,
    hasPublicLiability: false,
    insuranceExpiry: "",
    serviceCount: "",
    listOnMarketplace: null,
  })

  // Fetch current user name
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name as string | undefined
      if (name) setUserName(name)
    })
  }, [])

  // Progress animation on step 6
  useEffect(() => {
    if (step !== 6) return
    const interval = setInterval(() => {
      setProgressIdx((i) => {
        if (i >= PROGRESS_MESSAGES.length - 1) {
          clearInterval(interval)
          return i
        }
        return i + 1
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [step])

  // Kick off workspace creation at step 6
  useEffect(() => {
    if (step !== 6) return
    const run = async () => {
      try {
        const result = await createWorkspace({
          name: state.companyName.trim() || `${userName.split(" ")[0] || "My"} Supplier Account`,
          businessType: "supplier",
          operationInterests: state.tradeCategories,
          workspaceType: "supplier",
          supplierMeta: {
            tradeCategories: state.tradeCategories,
            staffBand: state.staffBand,
            baseLocation: state.baseLocation,
            radiusKm: state.radiusKm,
            acceptEmergency: state.acceptEmergency,
            hasPublicLiability: state.hasPublicLiability,
            insuranceExpiry: state.insuranceExpiry,
            serviceCount: state.serviceCount,
            listOnMarketplace: state.listOnMarketplace,
          },
        })
        setWorkspaceId(result.workspaceId)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to create profile."
        setSubmitError(msg)
        setStep(5)
      }
    }
    run()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof SupplierState>(key: K, value: SupplierState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const toggleTrade = (cat: string) => {
    setState((prev) => ({
      ...prev,
      tradeCategories: prev.tradeCategories.includes(cat)
        ? prev.tradeCategories.filter((c) => c !== cat)
        : [...prev.tradeCategories, cat],
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.tradeCategories
      return next
    })
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (step === 1 && state.tradeCategories.length === 0) {
      errs.tradeCategories = "Please select at least one trade category"
    }
    if (step === 2) {
      if (!state.companyName.trim()) errs.companyName = "Business name is required"
      if (!state.staffBand) errs.staffBand = "Please select your team size"
    }
    if (step === 3) {
      if (!state.baseLocation.trim()) errs.baseLocation = "Please enter your base location"
      if (!state.radiusKm) errs.radiusKm = "Please select a coverage radius"
    }
    if (step === 4 && !state.hasPublicLiability) {
      errs.hasPublicLiability = "You must confirm you have public liability insurance to list on the marketplace"
    }
    if (step === 5) {
      if (!state.serviceCount) errs.serviceCount = "Please select how many services you offer"
      if (state.listOnMarketplace === null) errs.listOnMarketplace = "Please choose yes or no"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (!validate()) return
    setStep((s) => s + 1)
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  const firstName = userName.split(" ")[0] || "there"

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/" className="flex items-center">
            <Image src="/propvora-logo-dark.png" alt="Propvora" width={420} height={105} className="h-8 w-auto" priority />
          </Link>
          <Link href="/" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors">
            Back to home
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8">

          {/* Step indicator (steps 1–5 only) */}
          {step <= 5 && <StepIndicator current={step} total={TOTAL_STEPS} />}

          {/* ── Step 1: Trade categories ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">
                  {userName ? `Welcome, ${firstName}!` : "Welcome!"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  What trades or services do you provide? Select all that apply.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRADE_CATEGORIES.map((cat) => {
                  const checked = state.tradeCategories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleTrade(cat)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                        checked
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                          checked ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300"
                        )}
                      >
                        {checked && <Check className="h-2.5 w-2.5 text-white" />}
                      </div>
                      <span className={cn("text-[13px] font-medium", checked ? "text-[#2563EB]" : "text-slate-700")}>
                        {cat}
                      </span>
                    </button>
                  )
                })}
              </div>

              {errors.tradeCategories && (
                <p className="text-xs text-red-500">{errors.tradeCategories}</p>
              )}
            </div>
          )}

          {/* ── Step 2: Business details ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Your business</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell property managers a little about your business.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Business or trading name <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Smith Plumbing Services"
                  value={state.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                  error={errors.companyName}
                  leftElement={<Building2 className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Years in business
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 5"
                  value={state.yearsInBusiness}
                  onChange={(e) => update("yearsInBusiness", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-700">
                  Team size <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_BANDS.map((band) => (
                    <button
                      key={band.value}
                      type="button"
                      aria-pressed={state.staffBand === band.value}
                      onClick={() => update("staffBand", band.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                        state.staffBand === band.value
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
                {errors.staffBand && <p className="text-xs text-red-500">{errors.staffBand}</p>}
              </div>
            </div>
          )}

          {/* ── Step 3: Service area ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Your service area</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Where are you based and how far will you travel?
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Base location <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Birmingham, West Midlands"
                  value={state.baseLocation}
                  onChange={(e) => update("baseLocation", e.target.value)}
                  error={errors.baseLocation}
                  leftElement={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-700">
                  Coverage radius <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      aria-pressed={state.radiusKm === r.value}
                      onClick={() => update("radiusKm", r.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                        state.radiusKm === r.value
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {errors.radiusKm && <p className="text-xs text-red-500">{errors.radiusKm}</p>}
              </div>

              {/* Emergency toggle */}
              <button
                type="button"
                aria-pressed={state.acceptEmergency}
                onClick={() => update("acceptEmergency", !state.acceptEmergency)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  state.acceptEmergency
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                    state.acceptEmergency ? "border-amber-500 bg-amber-500" : "border-slate-300"
                  )}
                >
                  {state.acceptEmergency && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-800">Accept emergency callouts</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Receive urgent job alerts outside normal hours. Higher rates typically apply.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ── Step 4: Insurance ────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Insurance confirmation</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Public liability insurance is required to work with property managers on Propvora.
                </p>
              </div>

              <button
                type="button"
                aria-pressed={state.hasPublicLiability}
                onClick={() => update("hasPublicLiability", !state.hasPublicLiability)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all",
                  state.hasPublicLiability
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                    state.hasPublicLiability ? "border-emerald-500 bg-emerald-500" : "border-slate-300"
                  )}
                >
                  {state.hasPublicLiability && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-800">
                      I confirm I hold valid public liability insurance
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    I understand Propvora may request proof before my first job. Cover should be a
                    minimum of £1,000,000.
                  </p>
                </div>
              </button>

              {errors.hasPublicLiability && (
                <p className="text-xs text-red-500">{errors.hasPublicLiability}</p>
              )}

              {state.hasPublicLiability && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                    Policy expiry date <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={state.insuranceExpiry}
                    onChange={(e) => update("insuranceExpiry", e.target.value)}
                  />
                </div>
              )}

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  We&apos;ll remind you before your policy expires so your profile stays active.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 5: Quick wins ───────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Almost done!</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Two quick questions to finish setting up your profile.
                </p>
              </div>

              {submitError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <span className="text-sm text-red-700">{submitError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-700">
                  How many services do you offer? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_COUNTS.map((sc) => (
                    <button
                      key={sc.value}
                      type="button"
                      aria-pressed={state.serviceCount === sc.value}
                      onClick={() => update("serviceCount", sc.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                        state.serviceCount === sc.value
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
                {errors.serviceCount && <p className="text-xs text-red-500">{errors.serviceCount}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-slate-700">
                  Do you want to list your services on the public marketplace? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: true, label: "Yes, list me publicly", sub: "Customers & operators can find and contact you" },
                    { value: false, label: "No, invite only", sub: "You only receive jobs from operators who invite you" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      aria-pressed={state.listOnMarketplace === opt.value}
                      onClick={() => update("listOnMarketplace", opt.value)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-all",
                        state.listOnMarketplace === opt.value
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <span className={cn("block text-sm font-semibold", state.listOnMarketplace === opt.value ? "text-[#2563EB]" : "text-slate-800")}>
                        {opt.label}
                      </span>
                      <span className="block mt-0.5 text-[11.5px] text-slate-500 leading-snug">{opt.sub}</span>
                    </button>
                  ))}
                </div>
                {errors.listOnMarketplace && <p className="text-xs text-red-500">{errors.listOnMarketplace}</p>}
              </div>

              {/* Accept marketplace terms if going public */}
              {state.listOnMarketplace === true && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    By continuing you agree to the{" "}
                    <Link href="/legal/marketplace-terms" target="_blank" className="font-semibold text-[#2563EB] hover:text-[#1d4ed8]">
                      Marketplace Supplier Terms
                    </Link>{" "}
                    and confirm your business details are accurate.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Creating workspace + success ─────────────────────────── */}
          {step === 6 && !workspaceId && (
            <div className="py-6 text-center space-y-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EFF6FF] border-4 border-[#DBEAFE]">
                <Loader2 className="h-9 w-9 text-[#2563EB] animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Setting up your supplier profile</h2>
                <p className="mt-2 text-sm text-slate-500">This will only take a moment…</p>
              </div>
              <div className="space-y-3">
                {PROGRESS_MESSAGES.map((msg, i) => (
                  <div key={msg} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                        i < progressIdx
                          ? "bg-emerald-500"
                          : i === progressIdx
                          ? "bg-[#2563EB]"
                          : "bg-slate-200"
                      )}
                    >
                      {i < progressIdx ? (
                        <Check className="h-3.5 w-3.5 text-white" />
                      ) : i === progressIdx ? (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-white/60" />
                      )}
                    </div>
                    <span className={cn("text-sm transition-all duration-300", i <= progressIdx ? "text-slate-700 font-medium" : "text-slate-400")}>
                      {msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 6: Success card ─────────────────────────────────────────── */}
          {step === 6 && workspaceId && (
            <div className="py-4 text-center space-y-6">
              {/* Profile preview card */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
                <Wrench className="h-8 w-8 text-amber-600" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">You&apos;re all set!</h2>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  Your supplier profile is ready. Here&apos;s a quick preview of how you&apos;ll appear to property managers.
                </p>
              </div>

              {/* Profile preview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold text-lg">
                    {(state.companyName || userName).slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#0D1B2A]">
                      {state.companyName || userName || "Your Business"}
                    </p>
                    <p className="text-[12px] text-slate-500">{state.tradeCategories.slice(0, 3).join(" · ")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  {state.baseLocation && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {state.baseLocation} · {state.radiusKm}km radius
                    </div>
                  )}
                  {state.hasPublicLiability && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Insurance confirmed
                    </div>
                  )}
                  {state.acceptEmergency && (
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <Zap className="h-3.5 w-3.5" />
                      Emergency callouts
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Star className="h-3.5 w-3.5" />
                    No reviews yet
                  </div>
                </div>
                {state.listOnMarketplace && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-[12px] text-blue-700 font-medium">Listed on public marketplace</span>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => router.push("/supplier")}
              >
                Start accepting jobs
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>

              <p className="text-[12px] text-slate-400">
                You can update your profile and add service listings from your supplier dashboard.
              </p>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          {step >= 1 && step <= 5 && (
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6 max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:-mb-5 max-sm:px-5 max-sm:pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] max-sm:bg-white/95 max-sm:backdrop-blur-md">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={back}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={next}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                {step === 5 ? "Create my profile" : "Continue"}
              </Button>
            </div>
          )}
        </div>

        {/* Skip link */}
        {step < 6 && (
          <p className="mt-4 text-center text-xs text-slate-400">
            <button
              type="button"
              onClick={() => router.push("/supplier")}
              className="hover:text-slate-600 transition-colors underline underline-offset-2"
            >
              Skip setup and go to dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
