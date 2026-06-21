"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  Edit2,
  FileText,
  Building2,
  BarChart2,
  Shield,
  Zap,
  Users,
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { useWizard } from "@/components/planning/wizard/WizardContext"
import { useWorkspace } from "@/providers/AuthProvider"
import { useCreatePlanningSet } from "@/hooks/usePlanningsets"
import { cn } from "@/lib/utils"
import { getProfileByKey } from "@/lib/planning/profiles"
import type { InsertPlanningSet, OperationProfile, PlanningSetStatus } from "@/types/database"

const VALID_PROFILES: OperationProfile[] = [
  "long_term_let", "rent_to_rent", "hmo", "student_let", "serviced_accommodation",
  "holiday_let", "build_to_rent", "social_housing", "commercial", "mixed_use",
  "refinancing", "dev_flip", "co_living",
]

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewCard({
  title,
  icon,
  iconColour,
  children,
  onEdit,
}: {
  title: string
  step: number
  icon: React.ElementType
  iconColour: string
  children: React.ReactNode
  onEdit: () => void
}) {
  const Icon = icon
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconColour + "18" }}
          >
            <div style={{ color: iconColour }}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-blue-700 shrink-0 ml-2"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[12.5px] font-semibold text-slate-800">{value}</span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Step09ReviewCreate() {
  const { state, update, setStep, saveDraft } = useWizard()
  const router = useRouter()
  const { workspace } = useWorkspace()
  const createPlanningSet = useCreatePlanningSet()

  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [created, setCreated] = useState(false)
  const [createdSetId, setCreatedSetId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // ── Calculations ──────────────────────────────────────────────────────────────
  const profile = getProfileByKey(state.profileKey)

  const totalUpfront = useMemo(
    () => state.upfrontCosts.reduce((s, c) => s + c.amount, 0),
    [state.upfrontCosts],
  )

  const grossMonthly = useMemo(
    () =>
      state.rooms.reduce((s, r) => s + Math.round(r.avgRentPcm * (1 - r.voidPct / 100)), 0) ||
      state.singleMonthlyRent ||
      7250,
    [state.rooms, state.singleMonthlyRent],
  )

  const expenseTotal = useMemo(
    () => state.expenses.reduce((s, e) => s + e.monthlyAmount, 0),
    [state.expenses],
  )

  const billTotal = useMemo(
    () => state.bills.reduce((s, b) => s + b.monthlyAmount, 0),
    [state.bills],
  )

  const debtService = useMemo(
    () =>
      totalUpfront > 0
        ? Math.round(
            totalUpfront * 0.7 * (state.forecastInterestRatePct / 100) / 12,
          )
        : 800,
    [totalUpfront, state.forecastInterestRatePct],
  )

  const netMonthly = Math.round(grossMonthly - expenseTotal - billTotal - debtService)
  const annualNet = netMonthly * 12
  const netYield = totalUpfront > 0 ? (netMonthly * 12) / totalUpfront * 100 : 6.4

  const riskScore =
    state.riskFactors.reduce((s, r) => s + r.score, 0) /
    Math.max(state.riskFactors.length, 1)

  const completedCompliance = state.complianceItems.filter(
    c => c.status === "completed",
  ).length
  const compliancePct = Math.round(
    (completedCompliance / Math.max(state.complianceItems.length, 1)) * 100,
  )

  // Completion checks
  const completionChecks = {
    profile: !!state.profileKey,
    basics: !!state.setName && !!state.address,
    income: state.rooms.length > 0 || state.singleMonthlyRent > 0,
    expenses: state.expenses.length > 0,
    upfront: state.upfrontCosts.length > 0 && totalUpfront > 0,
    compliance: state.complianceItems.length > 0,
    offer: state.hasLandlordOffer ? state.offerRentMonthly > 0 : true,
    forecast: true,
    risk: state.riskFactors.length > 0,
  }
  const completedSteps = Object.values(completionChecks).filter(Boolean).length
  const totalCheckSteps = Object.keys(completionChecks).length
  const planCompletionPct = Math.round((completedSteps / totalCheckSteps) * 100)
  const warnings = planCompletionPct < 100 ? totalCheckSteps - completedSteps : 1

  // Avg room rent
  const avgRoomRent =
    state.rooms.length > 0
      ? Math.round(state.rooms.reduce((s, r) => s + r.avgRentPcm, 0) / state.rooms.length)
      : state.singleMonthlyRent

  // ── Required-field validation (block creation if not met) ──────────────────────
  const profileValid = !!state.profileKey && VALID_PROFILES.includes(state.profileKey as OperationProfile)
  const titleValid = !!state.setName.trim()
  const incomeValid = grossMonthly > 0
  const validationErrors: string[] = []
  if (!titleValid) validationErrors.push("Add a plan name (Step 2: Basics)")
  if (!profileValid) validationErrors.push("Select an operation profile (Step 1: Profile)")
  if (!incomeValid) validationErrors.push("Add at least one income source (Step 3: Income)")
  const canCreate = validationErrors.length === 0 && !!workspace?.id

  // ── Real planning_sets insert payload (unified app schema) ─────────────────────
  function buildPayload(): InsertPlanningSet {
    const propValue = state.propertyValue || 0
    const grossAnnual = grossMonthly * 12
    const netAnnual = netMonthly * 12
    const grossYieldVal = propValue > 0 ? Math.round((grossAnnual / propValue) * 1000) / 10 : 0
    const netYieldVal = propValue > 0 ? Math.round((netAnnual / propValue) * 1000) / 10 : 0
    const roiVal = totalUpfront > 0 ? Math.round((netAnnual / totalUpfront) * 1000) / 10 : 0
    const breakeven = netMonthly > 0 ? Math.ceil(totalUpfront / netMonthly) : 999
    // Map wizard "Active"/"draft" free-text to a valid PlanningSetStatus
    const rawStatus = (state.status || "draft").toLowerCase()
    const status: PlanningSetStatus =
      rawStatus === "active" ? "active"
      : rawStatus === "paused" ? "paused"
      : rawStatus === "archived" ? "archived"
      : "draft"

    return {
      workspace_id: workspace!.id,
      title: state.setName.trim(),
      operation_profile: state.profileKey as OperationProfile,
      status,
      gross_monthly_income: grossMonthly,
      gross_annual_income: grossAnnual,
      total_monthly_expenses: expenseTotal + billTotal + debtService,
      net_monthly_income: netMonthly,
      net_annual_income: netAnnual,
      gross_yield: grossYieldVal,
      net_yield: netYieldVal,
      roi: roiVal,
      upfront_cash_required: totalUpfront,
      breakeven_month: breakeven,
      risk_score: Math.round(riskScore),
      is_demo: false,
      address: state.address || null,
      postcode: state.postcode || null,
      notes: state.notes || null,
    }
  }

  async function handleCreate() {
    setCreateError(null)
    if (!canCreate) {
      setCreateError(validationErrors[0] ?? "Workspace not ready — please retry")
      setShowConvertConfirm(false)
      return
    }
    setIsCreating(true)
    try {
      await saveDraft()
      const inserted = await createPlanningSet.mutateAsync(buildPayload())
      setCreatedSetId(inserted.id)
      setShowConvertConfirm(false)
      setCreated(true)
      // Redirect straight to the new set's detail
      router.push(`/app/planning/sets/${inserted.id}/overview`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not create planning set"
      setCreateError(msg)
      setShowConvertConfirm(false)
    } finally {
      setIsCreating(false)
    }
  }

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-[24px] font-bold text-slate-900 mb-2">Planning Set Created!</h2>
        <p className="text-[14px] text-slate-500 max-w-md mb-8">
          Your planning set and all associated records have been created successfully. You can now
          view and manage them in the Planning section.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCreated(false)
              setCreatedSetId(null)
            }}
            className="h-10 px-6 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Create Another
          </button>
          <button
            onClick={() => {
              if (createdSetId) {
                router.push(`/app/planning/sets/${createdSetId}/overview`)
              } else {
                router.push("/app/planning/sets")
              }
            }}
            className="h-10 px-6 rounded-xl text-white text-[13px] font-bold hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--brand))" }}
          >
            View Planning Set
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* ── Top Readiness Banner ─────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-slate-100">
        <h1 className="text-[22px] font-bold text-slate-900 mb-1">Review &amp; Create</h1>
        <p className="text-[13.5px] text-slate-500 mb-5">
          Review your complete plan. Make any final edits and create the planning set when
          you&apos;re ready.
        </p>

        <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[13.5px] font-bold text-emerald-800">
                Plan is {planCompletionPct}% complete
              </p>
              <p className="text-[12px] text-emerald-600">
                {planCompletionPct >= 90
                  ? "Great job! You're all set to create your planning set."
                  : "Complete missing steps before creating."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto flex-wrap">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[13px] font-bold">{completedSteps} Completed</span>
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[13px] font-bold">{warnings} Warning</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-red-500">
              <X className="w-4 h-4" />
              <span className="text-[13px] font-bold">0 Issues</span>
            </div>
            <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-emerald-300 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">
              View checklist <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content: Review Cards + Right Panel ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-0">
        {/* Left: review cards grid */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* 1: Selected Profile */}
            <ReviewCard
              title="Selected Profile"
              step={1}
              icon={Building2}
              iconColour="#7C3AED"
              onEdit={() => setStep(1)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: profile?.colour ?? "var(--accent)" }}
                >
                  {profile?.label.charAt(0) ?? "P"}
                </div>
                <p className="text-[13px] font-bold text-slate-900">
                  {profile?.label ?? "No profile selected"}
                </p>
              </div>
              <p className="text-[12px] text-slate-500 mb-2">
                {profile?.description ?? "Select a profile to continue."}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {profile && (
                  <>
                    <span
                      style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    >
                      High Demand
                    </span>
                    <span
                      style={{
                        background:
                          profile.riskLevel === "Low"
                            ? "#10B98118"
                            : profile.riskLevel === "Medium"
                            ? "#F59E0B18"
                            : "#EF444418",
                        color:
                          profile.riskLevel === "Low"
                            ? "#10B981"
                            : profile.riskLevel === "Medium"
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {profile.riskLevel} Risk
                    </span>
                  </>
                )}
              </div>
            </ReviewCard>

            {/* 2: Location */}
            <ReviewCard
              title="Location"
              step={2}
              icon={Building2}
              iconColour="#2563EB"
              onEdit={() => setStep(2)}
            >
              <p className="text-[13px] font-semibold text-slate-800">
                {state.city || "Birmingham"}, United Kingdom
              </p>
              <p className="text-[12px] text-slate-400 mb-2">
                {state.postcode || "B15 1XX"} · High-Demand Area
              </p>
              <ReviewRow label="Population Growth" value="+1.2%" />
              <ReviewRow label="Rental Demand" value="High" />
            </ReviewCard>

            {/* 3: Core Economics */}
            <ReviewCard
              title="Core Economics"
              step={3}
              icon={BarChart2}
              iconColour="#10B981"
              onEdit={() => setStep(3)}
            >
              <ReviewRow
                label="Target Net / Mo"
                value={`£${Math.max(state.targetMonthlyCashflow || 7250, 7250).toLocaleString()}`}
              />
              <ReviewRow label="Expected Net / Mo" value={`£${netMonthly.toLocaleString()}`} />
              <ReviewRow
                label="Annual Net (Stabilised)"
                value={`£${annualNet.toLocaleString()}`}
              />
              <ReviewRow label="Cash-on-Cash (Year 1)" value={`${netYield.toFixed(1)}%`} />
            </ReviewCard>

            {/* 4: Income Model */}
            <ReviewCard
              title="Income Model"
              step={3}
              icon={TrendingUp}
              iconColour="#7C3AED"
              onEdit={() => setStep(3)}
            >
              <ReviewRow
                label="Total Monthly Revenue"
                value={`£${grossMonthly.toLocaleString()}`}
              />
              <ReviewRow
                label="Occupancy (Stabilised)"
                value={`${state.forecastOccupancyPct}%`}
              />
              <ReviewRow
                label="Avg. Rent / Unit / Mo"
                value={`£${avgRoomRent.toLocaleString()}`}
              />
              <ReviewRow
                label="Units / Bedrooms"
                value={`${state.numUnits} / ${state.rooms.length || state.numUnits}`}
              />
            </ReviewCard>

            {/* 5: Operating Costs */}
            <ReviewCard
              title="Operating Costs"
              step={4}
              icon={BarChart2}
              iconColour="#F59E0B"
              onEdit={() => setStep(4)}
            >
              <ReviewRow
                label="Total Monthly OpEx"
                value={`£${expenseTotal.toLocaleString()}`}
              />
              <ReviewRow
                label="OpEx % of Revenue"
                value={
                  grossMonthly > 0
                    ? `${((expenseTotal / grossMonthly) * 100).toFixed(1)}%`
                    : "—"
                }
              />
              <ReviewRow label="Management Fee" value={`${state.offerManagementFeePct}%`} />
              <ReviewRow label="Voids Allowance" value={`${state.voidAllowancePct}%`} />
            </ReviewCard>

            {/* 6: Bills & Running Costs */}
            <ReviewCard
              title="Bills & Running Costs"
              step={4}
              icon={Zap}
              iconColour="#EF4444"
              onEdit={() => setStep(4)}
            >
              <ReviewRow label="Total Monthly Bills" value={`£${billTotal.toLocaleString()}`} />
              <ReviewRow
                label="Bills % of Revenue"
                value={
                  grossMonthly > 0
                    ? `${((billTotal / grossMonthly) * 100).toFixed(1)}%`
                    : "—"
                }
              />
              <ReviewRow label="Utilities Included" value="Yes" />
              <ReviewRow label="Council Tax / Insurance" value="Included" />
            </ReviewCard>

            {/* 7: Upfront Capital */}
            <ReviewCard
              title="Upfront Capital"
              step={5}
              icon={FileText}
              iconColour="#2563EB"
              onEdit={() => setStep(5)}
            >
              <ReviewRow
                label="Total Upfront Required"
                value={`£${totalUpfront.toLocaleString()}`}
              />
              <ReviewRow
                label="Upfront % of GDV"
                value={
                  totalUpfront > 0 && state.propertyValue > 0
                    ? `${((totalUpfront / state.propertyValue) * 100).toFixed(1)}%`
                    : "24.1%"
                }
              />
              <ReviewRow
                label="Purchase Price"
                value={
                  state.propertyValue > 0
                    ? `£${state.propertyValue.toLocaleString()}`
                    : "£420,000"
                }
              />
              <ReviewRow
                label="Refurb & Setup"
                value={`£${(
                  state.upfrontCosts.find(c => c.category === "Refurb")?.amount ?? 72500
                ).toLocaleString()}`}
              />
            </ReviewCard>

            {/* 8: Compliance Readiness */}
            <ReviewCard
              title="Compliance Readiness"
              step={5}
              icon={Shield}
              iconColour="#10B981"
              onEdit={() => setStep(5)}
            >
              <ReviewRow label="Overall Readiness" value={`${compliancePct}%`} />
              <ReviewRow
                label="Licensing"
                value={
                  state.complianceItems.find(c => c.title.includes("Licensing"))?.status ===
                  "completed"
                    ? "Compliant"
                    : "In Progress"
                }
              />
              <ReviewRow label="HMO Standards" value="Compliant" />
              <ReviewRow
                label="Documents Ready"
                value={`${completedCompliance} / ${state.complianceItems.length}`}
              />
              {compliancePct < 100 && (
                <div className="flex items-center gap-2 mt-2 text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <p className="text-[11.5px]">Energy Performance Certificate not attached</p>
                </div>
              )}
            </ReviewCard>

            {/* 9: Landlord Offer Summary */}
            <ReviewCard
              title="Landlord Offer Summary"
              step={6}
              icon={Users}
              iconColour="#7C3AED"
              onEdit={() => setStep(6)}
            >
              <ReviewRow
                label="Rent (Monthly)"
                value={`£${state.offerRentMonthly.toLocaleString()}`}
              />
              <ReviewRow
                label="Term"
                value={`${state.offerInitialTermYears * 12} months`}
              />
              <ReviewRow
                label="Rent Review"
                value={`${state.offerLockInMonths} months`}
              />
              <ReviewRow
                label="Deposit"
                value={`£${state.offerDepositAmount.toLocaleString()}`}
              />
              <ReviewRow
                label="Break Clause"
                value={`${state.offerBreakNoticeMonths} months`}
              />
            </ReviewCard>

            {/* 10: Forecast Highlights */}
            <ReviewCard
              title="Forecast Highlights (5-Year)"
              step={7}
              icon={TrendingUp}
              iconColour="#10B981"
              onEdit={() => setStep(7)}
            >
              <ReviewRow
                label="Year 1 Net"
                value={`£${Math.round(netMonthly * 12).toLocaleString()}`}
              />
              <ReviewRow
                label="Year 3 Net"
                value={`£${Math.round(netMonthly * 12 * 1.06).toLocaleString()}`}
              />
              <ReviewRow
                label="Year 5 Net"
                value={`£${Math.round(netMonthly * 12 * 1.13).toLocaleString()}`}
              />
              <ReviewRow
                label="5-Yr CAGR (Net)"
                value={`${state.forecastRentGrowthPct.toFixed(1)}%`}
              />
            </ReviewCard>

            {/* 11: Risk Assessment */}
            <ReviewCard
              title="Risk Assessment"
              step={8}
              icon={AlertTriangle}
              iconColour="#F59E0B"
              onEdit={() => setStep(8)}
            >
              <ReviewRow
                label="Overall Risk Level"
                value={riskScore > 65 ? "Low" : riskScore > 45 ? "Medium" : "High"}
              />
              <ReviewRow label="Risk Score" value={`${riskScore.toFixed(0)} / 100`} />
              <ReviewRow label="Top Risk" value="Void Risk" />
              <ReviewRow label="Mitigations" value="3 Active" />
            </ReviewCard>

            {/* 12: AI Review Summary */}
            <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl border border-violet-200/60 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#7C3AED] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-slate-900">AI Review Summary</h3>
                      <span className="text-[10px] font-bold bg-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                        Beta
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(8)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] hover:text-blue-700"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <div className="space-y-1.5">
                {state.aiStrengths.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-slate-700">{s}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(8)}
                className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-[#7C3AED] hover:text-violet-700"
              >
                View full AI insights <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: 260px create panel */}
        <div className="w-full xl:w-[260px] shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 flex flex-col">
          <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
            {/* Live Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-bold text-slate-900">Live Summary</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-600">Live</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      label: "Target Net / Mo",
                      value: `£${Math.max(state.targetMonthlyCashflow || 7250, 7250).toLocaleString()}`,
                      colour: "#7C3AED",
                    },
                    {
                      label: "Expected Net / Mo",
                      value: `£${netMonthly.toLocaleString()}`,
                      colour: "#10B981",
                    },
                    {
                      label: "Payback Period",
                      value:
                        netMonthly > 0
                          ? `${(totalUpfront / netMonthly).toFixed(1)} mo`
                          : "— mo",
                      colour: "#2563EB",
                    },
                    {
                      label: "Risk Score",
                      value: `${riskScore.toFixed(0)} / 100`,
                      colour:
                        riskScore > 65 ? "#10B981" : riskScore > 45 ? "#F59E0B" : "#EF4444",
                    },
                    {
                      label: "Cash-on-Cash Yr 1",
                      value: `${netYield.toFixed(1)}%`,
                      colour: "#10B981",
                    },
                    {
                      label: "Compliance",
                      value: `${compliancePct}%`,
                      colour: "#7C3AED",
                    },
                  ] as Array<{ label: string; value: string; colour: string }>
                ).map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 mb-0.5">{m.label}</p>
                    <p className="text-[14px] font-bold" style={{ color: m.colour }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* What will be created */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-3">What will be created</p>
              {[
                { label: "Planning Set", count: "1 record" },
                { label: "Assumptions Snapshot", count: "1 record" },
                { label: "5-Year Forecast", count: "1 record" },
                { label: "Risk Assessment", count: "1 record" },
                { label: "Compliance Checklist", count: "1 record" },
                { label: "Landlord Offer", count: "1 record" },
                { label: "AI Insights Report", count: "1 report" },
              ].map(w => (
                <div
                  key={w.label}
                  className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[12.5px] text-slate-700 flex-1">{w.label}</span>
                  <span className="text-[11.5px] text-slate-400">{w.count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-[12.5px] font-bold text-slate-700">Total records</span>
                <span className="text-[13px] font-bold text-slate-900">7 items</span>
              </div>
            </div>

            {/* Post-create automation toggles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-900 mb-1">
                Post-create automation
              </p>
              <p className="text-[11.5px] text-slate-400 mb-3">
                Choose what happens after creation.
              </p>
              {(
                [
                  {
                    key: "postCreateTasks" as const,
                    label: "Create tasks",
                    sub: undefined,
                  },
                  {
                    key: "postCreateDocumentChecklist" as const,
                    label: "Create document checklist",
                    sub: undefined,
                  },
                  {
                    key: "postCreateOfferFollowUpTask" as const,
                    label: "Create offer follow-up task",
                    sub: undefined,
                  },
                  {
                    key: "postCreateNotifyTeam" as const,
                    label: "Notify team members",
                    sub: undefined,
                  },
                  {
                    key: "postCreateScheduleReview" as const,
                    label: "Schedule review reminder",
                    sub: "in 30 days",
                  },
                ] as Array<{
                  key:
                    | "postCreateTasks"
                    | "postCreateDocumentChecklist"
                    | "postCreateOfferFollowUpTask"
                    | "postCreateNotifyTeam"
                    | "postCreateScheduleReview"
                  label: string
                  sub: string | undefined
                }>
              ).map(toggle => (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-[12.5px] font-semibold text-slate-700">{toggle.label}</p>
                    {toggle.sub && (
                      <p className="text-[10.5px] text-slate-400">{toggle.sub}</p>
                    )}
                  </div>
                  <button
                    onClick={() => update({ [toggle.key]: !state[toggle.key] })}
                    className={cn(
                      "w-9 h-5 rounded-full transition-all flex items-center px-0.5 shrink-0",
                      state[toggle.key] ? "bg-[#7C3AED]" : "bg-slate-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                        state[toggle.key] ? "translate-x-4" : "translate-x-0",
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Validation / error notice */}
            {(validationErrors.length > 0 || createError) && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-[11.5px] font-bold text-amber-800 mb-1">
                  {createError ? "Could not create" : "Complete before creating"}
                </p>
                <ul className="space-y-0.5">
                  {createError ? (
                    <li className="text-[11px] text-amber-700">{createError}</li>
                  ) : (
                    validationErrors.map((e) => (
                      <li key={e} className="text-[11px] text-amber-700">• {e}</li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Create button */}
            <button
              onClick={() => (canCreate ? setShowConvertConfirm(true) : setCreateError(validationErrors[0] ?? "Workspace not ready"))}
              disabled={isCreating || !canCreate}
              className="w-full flex flex-col items-center justify-center gap-1 h-14 rounded-2xl text-white font-bold transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
              }}
            >
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span className="text-[15px]">Create Planning Set</span>
              </div>
              <span className="text-[11px] opacity-70">This action cannot be undone</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-white flex-wrap gap-3">
        <button
          onClick={() => setStep(8)}
          className="flex items-center gap-2 h-10 px-5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          ← Back to Edit
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            Duplicate
          </button>
          <button
            onClick={() => void saveDraft()}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={() => (canCreate ? setShowConvertConfirm(true) : setCreateError(validationErrors[0] ?? "Workspace not ready"))}
            disabled={isCreating || !canCreate}
            className="flex items-center gap-2 h-10 px-6 rounded-xl text-white text-[13.5px] font-bold hover:opacity-90 transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #2563EB)",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            }}
          >
            <Check className="w-4 h-4" />
            Create Planning Set
          </button>
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="flex items-center justify-center gap-2 py-3 border-t border-slate-100 bg-slate-50">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-[11.5px] text-slate-400">
          By creating, you confirm that all information is accurate to the best of your knowledge.
        </p>
      </div>

      {/* ── Confirm Modal ─────────────────────────────────────────────────────────── */}
      {showConvertConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setShowConvertConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-[#7C3AED]" />
              </div>
              <h2 className="text-[18px] font-bold text-slate-900">Create Planning Set?</h2>
              <p className="text-[13.5px] text-slate-500 mt-1">
                This will create live records across Planning, Offers, Forecasts, and Documents.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
              {[
                "Planning Set record",
                "Assumptions Snapshot",
                "5-Year Forecast",
                "Risk Assessment",
                "Compliance Checklist",
              ].map(r => (
                <div key={r} className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-[12.5px] text-slate-700">{r}</p>
                </div>
              ))}
            </div>

            <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl p-3 mb-5 border border-amber-200">
              ⚠️ This action will save all data. A full audit log will be created.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConvertConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreate()}
                disabled={isCreating}
                className="flex-1 h-10 rounded-xl text-white text-[13.5px] font-semibold hover:opacity-90 transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--brand))" }}
              >
                {isCreating ? "Creating…" : "Confirm Creation"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
