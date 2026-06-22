"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  Home,
  Database,
  Sparkles,
  Loader2,
  ArrowRight,
  Upload,
  Globe,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"
import { createWorkspace } from "@/lib/actions/workspace"
import { getPlans, gbp } from "@/lib/billing/plans"

// ─── Types ────────────────────────────────────────────────────────────────────

type BusinessType =
  | "individual_investor"
  | "portfolio_operator"
  | "property_manager"
  | "btl_landlord"
  | "rent_to_rent"
  | "hmo_operator"
  | "other"

type PortfolioChoice = "import" | "manual" | "demo"
type DemoVariant = "full" | "rent_to_rent" | "hmo" | "serviced"
type PlanId = "starter" | "operator" | "scale" | "pro_agency"

interface WizardState {
  // Step 2
  workspaceName: string
  countryCode: string
  businessType: BusinessType | ""
  propertyCount: string
  // Step 3
  operationInterests: string[]
  // Step 4
  portfolioChoice: PortfolioChoice | ""
  // Step 5
  demoVariant: DemoVariant | ""
  // Step 6
  planId: PlanId
}

// ─── Country data ─────────────────────────────────────────────────────────────

interface OnboardingCountry {
  code: string
  label: string
  locale: string
  currency: string
  timezone: string
  dateFormat: string
}

const ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  { code: "GB", label: "United Kingdom", locale: "en-GB", currency: "GBP", timezone: "Europe/London", dateFormat: "DD/MM/YYYY" },
  { code: "IE", label: "Ireland", locale: "en-IE", currency: "EUR", timezone: "Europe/Dublin", dateFormat: "DD/MM/YYYY" },
  { code: "US", label: "United States", locale: "en-US", currency: "USD", timezone: "America/New_York", dateFormat: "MM/DD/YYYY" },
  { code: "AU", label: "Australia", locale: "en-AU", currency: "AUD", timezone: "Australia/Sydney", dateFormat: "DD/MM/YYYY" },
  { code: "NZ", label: "New Zealand", locale: "en-NZ", currency: "NZD", timezone: "Pacific/Auckland", dateFormat: "DD/MM/YYYY" },
  { code: "CA", label: "Canada", locale: "en-CA", currency: "CAD", timezone: "America/Toronto", dateFormat: "YYYY-MM-DD" },
  { code: "FR", label: "France", locale: "fr-FR", currency: "EUR", timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY" },
  { code: "DE", label: "Germany", locale: "de-DE", currency: "EUR", timezone: "Europe/Berlin", dateFormat: "DD.MM.YYYY" },
  { code: "ES", label: "Spain", locale: "es-ES", currency: "EUR", timezone: "Europe/Madrid", dateFormat: "DD/MM/YYYY" },
  { code: "IT", label: "Italy", locale: "it-IT", currency: "EUR", timezone: "Europe/Rome", dateFormat: "DD/MM/YYYY" },
  { code: "NL", label: "Netherlands", locale: "nl-NL", currency: "EUR", timezone: "Europe/Amsterdam", dateFormat: "DD/MM/YYYY" },
  { code: "BE", label: "Belgium", locale: "fr-FR", currency: "EUR", timezone: "Europe/Brussels", dateFormat: "DD/MM/YYYY" },
  { code: "PT", label: "Portugal", locale: "pt-BR", currency: "EUR", timezone: "Europe/Lisbon", dateFormat: "DD/MM/YYYY" },
  { code: "SE", label: "Sweden", locale: "sv-SE", currency: "SEK", timezone: "Europe/Stockholm", dateFormat: "YYYY-MM-DD" },
  { code: "DK", label: "Denmark", locale: "da-DK", currency: "DKK", timezone: "Europe/Copenhagen", dateFormat: "DD/MM/YYYY" },
  { code: "FI", label: "Finland", locale: "fi-FI", currency: "EUR", timezone: "Europe/Helsinki", dateFormat: "DD/MM/YYYY" },
  { code: "AT", label: "Austria", locale: "de-DE", currency: "EUR", timezone: "Europe/Vienna", dateFormat: "DD.MM.YYYY" },
  { code: "CH", label: "Switzerland", locale: "de-DE", currency: "CHF", timezone: "Europe/Zurich", dateFormat: "DD.MM.YYYY" },
  { code: "AE", label: "United Arab Emirates", locale: "en-GB", currency: "AED", timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY" },
  { code: "JP", label: "Japan", locale: "ja-JP", currency: "JPY", timezone: "Asia/Tokyo", dateFormat: "YYYY/MM/DD" },
]

function countryFromCode(code: string): OnboardingCountry {
  return ONBOARDING_COUNTRIES.find((c) => c.code === code) ?? ONBOARDING_COUNTRIES[0]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 8

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "individual_investor", label: "Individual investor" },
  { value: "portfolio_operator", label: "Portfolio operator" },
  { value: "property_manager", label: "Property manager" },
  { value: "btl_landlord", label: "BTL landlord" },
  { value: "rent_to_rent", label: "Rent-to-rent operator" },
  { value: "hmo_operator", label: "HMO operator" },
  { value: "other", label: "Other" },
]

const PROPERTY_COUNTS = [
  { value: "0", label: "None yet" },
  { value: "1-5", label: "1 – 5" },
  { value: "6-20", label: "6 – 20" },
  { value: "21-50", label: "21 – 50" },
  { value: "50+", label: "50+" },
]

// The 13 operation profiles (matches the database enum). These are operation
// profiles — not "verticals".
const OPERATION_TYPES = [
  { value: "long_term_let", label: "Long-Term Let" },
  { value: "rent_to_rent", label: "Rent-to-Rent" },
  { value: "hmo", label: "HMO" },
  { value: "student_let", label: "Student Let" },
  { value: "serviced_accommodation", label: "Serviced Accommodation" },
  { value: "holiday_let", label: "Holiday Let" },
  { value: "build_to_rent", label: "Build-to-Rent" },
  { value: "social_housing", label: "Social Housing" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "refinancing", label: "Refinancing" },
  { value: "dev_flip", label: "Development / Flip" },
  { value: "co_living", label: "Co-Living" },
]

const DEMO_VARIANTS: { value: DemoVariant; label: string; description: string }[] = [
  { value: "full", label: "Full demo workspace", description: "Mix of property types, tenants, finances and documents" },
  { value: "rent_to_rent", label: "Rent-to-rent focused", description: "R2R contracts, cashflow and management fee tracking" },
  { value: "hmo", label: "HMO focused", description: "Room-by-room HMO with compliance and licensing" },
  { value: "serviced", label: "Serviced accommodation", description: "SA units, channel bookings and occupancy data" },
]

// Canonical plans — derived from src/lib/billing/plans.ts (single source of
// truth, same as the marketing pricing page). Names, highlights and prices are
// never duplicated/invented here; price shows "Custom" until a Stripe amount is
// set. Onboarding offers the four operator tiers (Enterprise is sales-led).
const ONBOARDING_TIERS: PlanId[] = ["starter", "operator", "scale", "pro_agency"]
const PLANS: { id: PlanId; name: string; price: string; popular: boolean; features: string[] }[] = getPlans()
  .filter((p) => (ONBOARDING_TIERS as string[]).includes(p.tier))
  .map((p) => ({
    id: p.tier as PlanId,
    name: p.name,
    price: p.monthlyAmount != null ? `${gbp(p.monthlyAmount)}/mo` : "Custom",
    popular: Boolean(p.popular),
    features: p.highlights,
  }))

const PROGRESS_MESSAGES = [
  "Creating your workspace…",
  "Setting up your portfolio…",
  "Injecting demo data…",
  "Finalising your account…",
  "Almost ready…",
]

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-6 sm:mb-8" role="img" aria-label={`Step ${current} of ${total}`}>
      {/* Mobile: compact progress bar + label (the dot rail is cramped on phones) */}
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

      {/* Desktop: numbered dot rail */}
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
        <p className="mt-2 text-xs text-slate-400">
          Step {current} of {total}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [userName, setUserName] = useState("")
  const [progressMessageIndex, setProgressMessageIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Final-step opt-in for the in-app guided tour. Persisted to the SAME
  // localStorage key the GuidedHelpProvider reads ("propvora.help.enabled"),
  // so the choice carries straight into the app shell.
  const [showTour, setShowTour] = useState(true)
  // Coupon code state
  const [couponInput, setCouponInput] = useState("")
  const [couponBusy, setCouponBusy] = useState(false)
  const [couponResult, setCouponResult] = useState<{
    valid: boolean; summary?: string; error?: string; code?: string
  } | null>(null)

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponBusy(true)
    setCouponResult(null)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, planType: state.planId }),
      })
      const json = await res.json().catch(() => ({ valid: false, error: "Unknown error" }))
      setCouponResult(json)
    } catch {
      setCouponResult({ valid: false, error: "Could not validate coupon." })
    } finally {
      setCouponBusy(false)
    }
  }

  const [state, setState] = useState<WizardState>({
    workspaceName: "",
    countryCode: "GB",
    businessType: "",
    propertyCount: "",
    operationInterests: [],
    portfolioChoice: "",
    demoVariant: "",
    planId: "operator",
  })

  const STORAGE_KEY = "propvora_onboarding_progress"

  // Restore saved progress (resume) on first mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { step?: number; state?: WizardState }
        if (saved.state) setState((prev) => ({ ...prev, ...saved.state }))
        // Never resume directly into the creating/review steps to avoid
        // re-triggering workspace creation on reload.
        if (saved.step && saved.step >= 2 && saved.step <= 6) setStep(saved.step)
      }
    } catch {
      // Ignore malformed saved state.
    }
  }, [])

  // Persist progress whenever step or state changes (skip the final creation steps).
  useEffect(() => {
    try {
      if (step >= 7) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, state }))
    } catch {
      // Storage unavailable — non-fatal.
    }
  }, [step, state])

  // Fetch user name from Supabase
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name as string | undefined
      setUserName(name ?? "")
      if (name) {
        setState((prev) => ({
          ...prev,
          workspaceName: prev.workspaceName || `${name.split(" ")[0]}'s Portfolio`,
        }))
      }
    })
  }, [])

  // Progress animation on final step
  useEffect(() => {
    if (step !== 8) return
    const interval = setInterval(() => {
      setProgressMessageIndex((i) => {
        if (i >= PROGRESS_MESSAGES.length - 1) {
          clearInterval(interval)
          return i
        }
        return i + 1
      })
    }, 1200)
    return () => clearInterval(interval)
  }, [step])

  // Kick off workspace creation when we hit step 8
  useEffect(() => {
    if (step !== 8) return
    const run = async () => {
      try {
        const country = countryFromCode(state.countryCode)
        const result = await createWorkspace({
          name: state.workspaceName || "My Portfolio",
          businessType: state.businessType,
          operationInterests: state.operationInterests,
          primaryOperationProfile: state.operationInterests[0],
          demoDataVariant: state.portfolioChoice === "demo" ? state.demoVariant || "full" : undefined,
          countryCode: country.code,
          defaultLocale: country.locale,
          defaultCurrency: country.currency,
          defaultTimezone: country.timezone,
          defaultDateFormat: country.dateFormat,
        })
        if (!result.ok) {
          const msg = "error" in result ? result.error : "Service temporarily unavailable. Please try again."
          setStep(7)
          setErrors({ submit: msg })
          return
        }
        // Onboarding complete — clear saved progress so it doesn't resume.
        try {
          localStorage.removeItem(STORAGE_KEY)
          // Carry the tour opt-out into the app (GuidedHelpProvider reads this key).
          localStorage.setItem("propvora.help.enabled", String(showTour))
        } catch {
          // Non-fatal.
        }
        // Let the animation play a bit before redirecting.
        // Hard navigation (not router.push + refresh): after workspace creation
        // the session is set; a push would re-request /onboarding which the proxy
        // redirects to /property-manager for the now-authenticated user — but a
        // full assign picks up the session cookie immediately and lands them in
        // their new workspace directly.
        setTimeout(() => {
          window.location.assign("/property-manager")
        }, 4000)
      } catch {
        setStep(7)
        setErrors({ submit: "Failed to create workspace. Please try again." })
      }
    }
    run()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const toggleInterest = (value: string) => {
    setState((prev) => ({
      ...prev,
      operationInterests: prev.operationInterests.includes(value)
        ? prev.operationInterests.filter((v) => v !== value)
        : [...prev.operationInterests, value],
    }))
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (step === 2) {
      if (!state.workspaceName.trim()) errs.workspaceName = "Workspace name is required"
      if (!state.businessType) errs.businessType = "Please select a business type"
      if (!state.propertyCount) errs.propertyCount = "Please select a portfolio size"
    }
    if (step === 3) {
      if (state.operationInterests.length === 0)
        errs.operationInterests = "Please select at least one operation type"
    }
    if (step === 4) {
      if (!state.portfolioChoice) errs.portfolioChoice = "Please choose how you want to start"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (!validate()) return
    // Skip step 5 (demo variant) if not using demo data
    if (step === 4 && state.portfolioChoice !== "demo") {
      setStep(6)
      return
    }
    setStep((s) => s + 1)
  }

  const back = () => {
    // If going back from step 6 and portfolioChoice is not demo, go to step 4
    if (step === 6 && state.portfolioChoice !== "demo") {
      setStep(4)
      return
    }
    setStep((s) => s - 1)
  }

  // ─── Render steps ───────────────────────────────────────────────────────────

  const firstName = userName.split(" ")[0] || "there"

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-lg">
        {/* Top bar — logo + return home */}
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

          {/* Steps 1–7: show step indicator */}
          {step < 8 && <StepIndicator current={step} total={TOTAL_STEPS} />}

          {/* ── Step 1: Welcome ─────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE]">
                <Sparkles className="h-8 w-8 text-[#2563EB]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0D1B2A]">
                  Welcome to Propvora{userName ? `, ${firstName}` : ""}!
                </h1>
                <p className="mt-2 text-slate-500 leading-relaxed">
                  Your property operations command centre. Let&apos;s get your workspace
                  set up in just a few steps.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: <Home className="h-5 w-5" />, label: "Portfolio management" },
                  { icon: <Users className="h-5 w-5" />, label: "Tenant & lease tracking" },
                  { icon: <Building2 className="h-5 w-5" />, label: "Financials & reports" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100"
                  >
                    <span className="text-[#2563EB]">{item.icon}</span>
                    <span className="text-xs text-slate-600 font-medium leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button variant="primary" size="lg" className="w-full" onClick={next}>
                Get started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Step 2: Business details ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Your business details</h2>
                <p className="mt-1 text-sm text-slate-500">Help us personalise your Propvora experience.</p>
              </div>

              <Input
                label="Workspace name"
                placeholder="e.g. Johnson Property Portfolio"
                value={state.workspaceName}
                onChange={(e) => update("workspaceName", e.target.value)}
                error={errors.workspaceName}
                hint="This is the name of your workspace — you can change it later"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Country <span className="text-red-400 ml-0.5">*</span>
                </label>
                <select
                  value={state.countryCode}
                  onChange={(e) => update("countryCode", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                >
                  {ONBOARDING_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.currency})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Sets your default currency, date format and locale. You can change this in workspace settings later.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Business type <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      aria-pressed={state.businessType === bt.value}
                      onClick={() => update("businessType", bt.value)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all",
                        state.businessType === bt.value
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
                {errors.businessType && (
                  <p className="text-xs text-red-500">{errors.businessType}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  How many properties do you currently manage? <span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_COUNTS.map((pc) => (
                    <button
                      key={pc.value}
                      type="button"
                      aria-pressed={state.propertyCount === pc.value}
                      onClick={() => update("propertyCount", pc.value)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                        state.propertyCount === pc.value
                          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {pc.label}
                    </button>
                  ))}
                </div>
                {errors.propertyCount && (
                  <p className="text-xs text-red-500">{errors.propertyCount}</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Operation interests ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Operation types</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Which property operation models do you use or are interested in?
                </p>
              </div>

              <div className="space-y-2">
                {OPERATION_TYPES.map((op) => {
                  const checked = state.operationInterests.includes(op.value)
                  return (
                    <button
                      key={op.value}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleInterest(op.value)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        checked
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                          checked
                            ? "border-[#2563EB] bg-[#2563EB]"
                            : "border-slate-300"
                        )}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn("text-sm font-medium", checked ? "text-[#2563EB]" : "text-slate-700")}>
                        {op.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.operationInterests && (
                <p className="text-xs text-red-500">{errors.operationInterests}</p>
              )}
            </div>
          )}

          {/* ── Step 4: Portfolio setup ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Portfolio setup</h2>
                <p className="mt-1 text-sm text-slate-500">How would you like to start?</p>
              </div>

              <div className="space-y-3">
                {/* Bulk CSV import is not part of the guided onboarding flow. Rather
                    than a fake unavailable placeholder, this is an honest disabled
                    option that explains the real alternative (manual setup) and
                    lets the user switch to it in one click. */}
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300">
                    <Upload className="h-2.5 w-2.5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">Import my properties</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Not in setup
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Spreadsheet import isn&apos;t part of the guided setup.{" "}
                      <button
                        type="button"
                        onClick={() => update("portfolioChoice", "manual")}
                        className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] underline underline-offset-2"
                      >
                        Start with manual setup
                      </button>{" "}
                      to add your first properties now.
                    </p>
                  </div>
                </div>

                {/* Add manually */}
                <button
                  type="button"
                  aria-pressed={state.portfolioChoice === "manual"}
                  onClick={() => update("portfolioChoice", "manual")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all",
                    state.portfolioChoice === "manual"
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      state.portfolioChoice === "manual"
                        ? "border-[#2563EB] bg-[#2563EB]"
                        : "border-slate-300"
                    )}
                  >
                    {state.portfolioChoice === "manual" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Add properties manually</span>
                    <p className="mt-0.5 text-xs text-slate-500">Start from scratch and add your own data</p>
                  </div>
                </button>

                {/* Demo data */}
                <button
                  type="button"
                  aria-pressed={state.portfolioChoice === "demo"}
                  onClick={() => update("portfolioChoice", "demo")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all",
                    state.portfolioChoice === "demo"
                      ? "border-[#2563EB] bg-[#EFF6FF]"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                      state.portfolioChoice === "demo"
                        ? "border-[#2563EB] bg-[#2563EB]"
                        : "border-slate-300"
                    )}
                  >
                    {state.portfolioChoice === "demo" && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">Start with demo data</span>
                      <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-xs text-white">
                        Recommended
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Explore Propvora with realistic sample data — clearly labelled, removable any time
                    </p>
                  </div>
                </button>
              </div>
              {errors.portfolioChoice && (
                <p className="text-xs text-red-500">{errors.portfolioChoice}</p>
              )}
            </div>
          )}

          {/* ── Step 5: Demo variant ─────────────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Choose your demo workspace</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pick the demo dataset that best matches your focus area.
                </p>
              </div>

              <div className="space-y-3">
                {DEMO_VARIANTS.map((dv) => (
                  <button
                    key={dv.value}
                    type="button"
                    aria-pressed={state.demoVariant === dv.value}
                    onClick={() => update("demoVariant", dv.value)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all",
                      state.demoVariant === dv.value
                        ? "border-[#2563EB] bg-[#EFF6FF]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        state.demoVariant === dv.value
                          ? "border-[#2563EB] bg-[#2563EB]"
                          : "border-slate-300"
                      )}
                    >
                      {state.demoVariant === dv.value && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{dv.label}</span>
                      <p className="mt-0.5 text-xs text-slate-500">{dv.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
                <Database className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Demo data is clearly labelled throughout the app and can be removed at any time
                  from your workspace settings.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 6: Plan selection ───────────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#0D1B2A]">Choose your plan</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Start your 7-day free trial — no card required. Cancel any time.
                </p>
              </div>

              <div className="space-y-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={state.planId === plan.id}
                    onClick={() => update("planId", plan.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-4 text-left transition-all",
                      state.planId === plan.id
                        ? "border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            state.planId === plan.id
                              ? "border-[#2563EB] bg-[#2563EB]"
                              : "border-slate-300"
                          )}
                        >
                          {state.planId === plan.id && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{plan.name}</span>
                            {plan.popular && (
                              <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-xs text-white">
                                Most popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {plan.features.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#0D1B2A]">{plan.price}</span>
                        <span className="text-xs text-slate-400">/mo</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Coupon code input */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-slate-600">Have a coupon code?</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. EARLY50"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponResult(null) }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon() } }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                    aria-label="Coupon code"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy || !couponInput.trim()}
                    className="shrink-0 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {couponBusy ? "…" : "Apply"}
                  </button>
                </div>
                {couponResult && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs rounded-lg px-3 py-2 border",
                    couponResult.valid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-red-50 text-red-600 border-red-100"
                  )}>
                    {couponResult.valid ? "✓" : "✗"}
                    <span>{couponResult.valid ? couponResult.summary : couponResult.error}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  You won&apos;t be charged today. Your workspace starts on a 7-day free
                  trial with no card required — you can add billing later from workspace
                  settings when you&apos;re ready.
                </p>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={next}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                >
                  I&apos;ll decide later — skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Step 7: Review ───────────────────────────────────────────────── */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">Review &amp; create</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm your workspace details before we set everything up.
                </p>
              </div>

              {errors.submit && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <span className="text-sm text-red-700">{errors.submit}</span>
                </div>
              )}

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {[
                  {
                    label: "Workspace name",
                    value: state.workspaceName || "My Portfolio",
                    step: 2,
                  },
                  {
                    label: "Country",
                    value: countryFromCode(state.countryCode).label,
                    step: 2,
                  },
                  {
                    label: "Business type",
                    value:
                      BUSINESS_TYPES.find((b) => b.value === state.businessType)?.label ?? "—",
                    step: 2,
                  },
                  {
                    label: "Portfolio size",
                    value:
                      PROPERTY_COUNTS.find((p) => p.value === state.propertyCount)?.label ?? "—",
                    step: 2,
                  },
                  {
                    label: "Operation types",
                    value:
                      state.operationInterests.length > 0
                        ? state.operationInterests
                            .map(
                              (v) => OPERATION_TYPES.find((o) => o.value === v)?.label ?? v
                            )
                            .join(", ")
                        : "—",
                    step: 3,
                  },
                  {
                    label: "Starting with",
                    value:
                      state.portfolioChoice === "demo"
                        ? `Demo data (${DEMO_VARIANTS.find((d) => d.value === state.demoVariant)?.label ?? "Full"})`
                        : state.portfolioChoice === "manual"
                        ? "Manual setup"
                        : "—",
                    step: 4,
                  },
                  {
                    label: "Plan",
                    value:
                      PLANS.find((p) => p.id === state.planId)?.name +
                      " — " +
                      PLANS.find((p) => p.id === state.planId)?.price +
                      "/mo (7-day trial)",
                    step: 6,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <span className="text-xs font-medium text-slate-500 shrink-0 pt-0.5">
                      {row.label}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-800 text-right">{row.value}</span>
                      <button
                        type="button"
                        onClick={() => setStep(row.step)}
                        className="shrink-0 text-xs text-[#2563EB] hover:text-[#1d4ed8] font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guided tour opt-in / opt-out */}
              <button
                type="button"
                onClick={() => setShowTour((v) => !v)}
                aria-pressed={showTour}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  showTour
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                    showTour ? "border-[#2563EB] bg-[#2563EB]" : "border-slate-300"
                  )}
                >
                  {showTour && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-800">Show me around</span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Display guided walkthroughs and tips as you explore. Untick to skip the tour — you can re-enable it any time in Preferences.
                  </p>
                </div>
              </button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={next}
              >
                Create my workspace
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── Step 8: Creating workspace ───────────────────────────────────── */}
          {step === 8 && (
            <div className="py-6 text-center space-y-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EFF6FF] border-4 border-[#DBEAFE]">
                <Loader2 className="h-9 w-9 text-[#2563EB] animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0D1B2A]">
                  Setting up your workspace
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  This will only take a moment…
                </p>
              </div>
              <div className="space-y-3">
                {PROGRESS_MESSAGES.map((msg, i) => (
                  <div key={msg} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-500",
                        i < progressMessageIndex
                          ? "bg-emerald-500"
                          : i === progressMessageIndex
                          ? "bg-[#2563EB]"
                          : "bg-slate-200"
                      )}
                    >
                      {i < progressMessageIndex ? (
                        <Check className="h-3.5 w-3.5 text-white" />
                      ) : i === progressMessageIndex ? (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-white/60" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm transition-all duration-300",
                        i <= progressMessageIndex
                          ? "text-slate-700 font-medium"
                          : "text-slate-400"
                      )}
                    >
                      {msg}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                You&apos;ll be redirected to your dashboard automatically.
              </p>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          {step >= 2 && step <= 7 && (
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6 max-sm:sticky max-sm:bottom-0 max-sm:-mx-5 max-sm:-mb-5 max-sm:px-5 max-sm:pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] max-sm:bg-white/95 max-sm:backdrop-blur-md">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={back}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Back
              </Button>

              {step < 7 && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={next}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Continue
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Skip onboarding link */}
        {step < 7 && (
          <p className="mt-4 text-center text-xs text-slate-400">
            <button
              type="button"
              onClick={() => window.location.assign("/property-manager")}
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
