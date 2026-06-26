"use client"

import React, { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { CreditCard, AlertTriangle, ExternalLink, Check, Loader2, Sparkles } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import {
  getPlans,
  getPriceId,
  gbp,
  PLAN_ORDER,
  type PlanTier,
  type BillingInterval,
} from "@/lib/billing/plans"
import { startCheckout, openBillingPortal } from "@/lib/billing/checkout"

const TIER_COLOUR: Record<PlanTier, string> = {
  starter: "#64748B",
  operator: "#2563EB",
  scale: "#0EA5E9",
  pro_agency: "#7C3AED",
  enterprise: "#D97706",
}

function normaliseTier(plan: string | null | undefined): PlanTier {
  const p = (plan ?? "").toLowerCase()
  if (PLAN_ORDER.includes(p as PlanTier)) return p as PlanTier
  // Legacy aliases → closest tier
  if (p === "trial" || p === "basic") return "starter"
  if (p === "growth") return "operator"
  if (p === "pro" || p === "business" || p === "agency") return "pro_agency"
  return "starter"
}

export default function SubscriptionPage() {
  const { workspace } = useWorkspace()
  const [billing, setBilling] = useState<BillingInterval>("monthly")
  const [pendingTier, setPendingTier] = useState<PlanTier | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const plans = useMemo(() => getPlans(), [])
  const currentTier = normaliseTier(workspace?.plan as string | undefined)
  const statusRaw = (workspace as { plan_status?: string } | null)?.plan_status ?? "trialing"
  const currentPlan = plans.find((p) => p.tier === currentTier)
  const currentIdx = PLAN_ORDER.indexOf(currentTier)

  async function handleSelect(tier: PlanTier) {
    setError(null)
    if (tier === "enterprise") {
      window.location.href = "/contact?topic=enterprise"
      return
    }
    const priceId = getPriceId(tier, billing)
    if (!priceId) {
      setError("This plan isn’t available for checkout yet. Please contact support.")
      return
    }
    setPendingTier(tier)
    try {
      await startCheckout(priceId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed")
      setPendingTier(null)
    }
  }

  async function handlePortal() {
    setError(null)
    setPortalLoading(true)
    try {
      await openBillingPortal()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Billing portal unavailable")
    } finally {
      setPortalLoading(false)
    }
  }

  const statusLabel =
    { active: "Active", trialing: "Trial", past_due: "Past due", canceled: "Canceled", suspended: "Suspended" }[
      statusRaw
    ] ?? "Active"

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Subscription</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Manage your plan, billing cycle and usage limits</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
      )}

      {/* Current plan card */}
      <div className="bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-wide">Current Plan</p>
            <h2 className="text-[22px] font-black mt-1">{currentPlan?.name ?? "Starter"} Plan</h2>
            <p className="text-[12px] text-blue-200 mt-0.5">{currentPlan?.tagline}</p>
          </div>
          <span className="bg-white/20 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl">{statusLabel}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/20">
          {[
            { label: "Properties", value: String(currentPlan?.features.properties ?? "—") },
            { label: "Team seats", value: String(currentPlan?.features.teamSeats ?? "—") },
            { label: "AI Copilot", value: currentPlan?.features.aiCopilot ? "Included" : "—" },
            { label: "Advanced reports", value: currentPlan?.features.advancedReports ? "Included" : "—" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[10px] text-blue-200 uppercase tracking-wide">{item.label}</p>
              <p className="text-[14px] font-bold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing cycle toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Billing Cycle</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {billing === "annual" ? "Annual billing — two months free" : "Switch to annual and get two months free"}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12.5px] font-semibold transition-all",
                  billing === cycle ? "bg-white text-[#2563EB] shadow-sm" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {cycle === "monthly" ? "Monthly" : "Annual · 2 months free"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {plans.map((plan) => {
          const colour = TIER_COLOUR[plan.tier]
          const isCurrent = plan.tier === currentTier
          const idx = PLAN_ORDER.indexOf(plan.tier)
          const amount = billing === "monthly" ? plan.monthlyAmount : plan.annualAmount
          const priceLabel = plan.enterprise
            ? "Custom"
            : amount != null
              ? `${gbp(amount)}`
              : "—"
          const cycleLabel = plan.enterprise ? "" : billing === "monthly" ? "/mo" : "/yr"
          const cta = plan.enterprise
            ? "Contact Sales"
            : isCurrent
              ? "Current Plan"
              : idx < currentIdx
                ? "Downgrade"
                : "Upgrade"
          return (
            <div
              key={plan.tier}
              className={cn(
                "bg-white rounded-2xl border p-5 flex flex-col relative",
                isCurrent ? "border-[#2563EB] shadow-[0_0_0_2px_#2563EB20]" : "border-slate-200",
              )}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full text-white bg-[#2563EB]">
                  Popular
                </span>
              )}
              {isCurrent && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: colour }}
                >
                  Current
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: colour + "18" }}>
                  <div style={{ color: colour }}>
                    {plan.features.aiCopilot ? <Sparkles className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>
                </div>
                <h3 className="text-[14px] font-bold text-slate-900">{plan.name}</h3>
              </div>
              <div className="mb-4">
                <span className="text-[22px] font-black" style={{ color: colour }}>{priceLabel}</span>
                <span className="text-[12px] text-slate-400 font-semibold">{cycleLabel}</span>
              </div>
              <div className="space-y-2 flex-1 mb-5">
                {plan.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: colour }} />
                    <span className="text-[11.5px] text-slate-600">{h}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={isCurrent || pendingTier === plan.tier}
                onClick={() => handleSelect(plan.tier)}
                className={cn(
                  "w-full py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors flex items-center justify-center gap-1.5",
                  isCurrent
                    ? "border border-slate-200 text-slate-400 cursor-default"
                    : "text-white hover:opacity-90",
                )}
                style={isCurrent ? undefined : { backgroundColor: colour }}
              >
                {pendingTier === plan.tier && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Billing Actions</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2563EB] text-[#2563EB] text-[13px] font-semibold hover:bg-blue-50 transition-colors disabled:opacity-60"
          >
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Open billing portal
          </button>
          <button
            onClick={handlePortal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Cancel or change plan
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Plan changes, cancellations, payment methods and receipts are managed securely in the billing portal.
        </p>
      </div>
    </div>
  )
}
