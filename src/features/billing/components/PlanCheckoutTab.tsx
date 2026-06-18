"use client"

import React, { useMemo, useState } from "react"
import { Check, CreditCard, MapPin, Sparkles, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { usePlans, useActiveAddons, useBillingProfile, usePaymentMethod, useBillingRole } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { computeTotals, planCyclePence, planAnnualPence, taxRatePercent } from "../data/calc"
import type { BillingCycle, PlanCode, SubscriptionAddon } from "../data/types"
import { BillingCard, BillingButton, Toggle, QtyStepper, StatusBadge, SeedNotice, PermissionNotice } from "./ui"

export function PlanCheckoutTab() {
  const { data: plans, source } = usePlans()
  const { data: activeAddons } = useActiveAddons()
  const { data: profile } = useBillingProfile()
  const { data: card } = usePaymentMethod()
  const { canManageBilling } = useBillingRole()

  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [selected, setSelected] = useState<PlanCode>("professional")
  const [addons, setAddons] = useState<SubscriptionAddon[]>(
    SEED_ADDON_CATALOG.map((c) => {
      const existing = activeAddons.find((a) => a.code === c.code)
      return { code: c.code, enabled: existing?.enabled ?? false, quantity: existing?.quantity ?? (c.unit === "credit_pack" ? 0 : c.defaultQty) }
    }),
  )
  const [submitState, setSubmitState] = useState<"idle" | "processing" | "done">("idle")
  const [editingAddress, setEditingAddress] = useState(false)

  const checkoutAddons = SEED_ADDON_CATALOG.filter((c) =>
    ["extra_listings", "premium_support", "ai_pack", "automation_pack", "marketplace_boost"].includes(c.code),
  )

  const plan = useMemo(() => plans.find((p) => p.code === selected) ?? plans[0], [plans, selected])
  const totals = useMemo(
    () => computeTotals(plan, cycle, SEED_ADDON_CATALOG, addons, profile.taxRateBps),
    [plan, cycle, addons, profile.taxRateBps],
  )

  function setAddon(code: string, patch: Partial<SubscriptionAddon>) {
    setAddons((prev) => prev.map((a) => (a.code === code ? { ...a, ...patch } : a)))
  }

  function proceed() {
    setSubmitState("processing")
    // Modelled checkout — NO live Stripe calls. A webhook would confirm later.
    setTimeout(() => setSubmitState("done"), 700)
  }

  return (
    <div className="space-y-6">
      <PermissionNotice canManage={canManageBilling} />

      {/* 1. Choose plan */}
      <BillingCard
        title="1. Choose your plan"
        description="Switch between monthly and annual billing."
        action={
          <div className="inline-flex items-center rounded-xl border border-slate-200 p-0.5 text-[12px] font-semibold">
            <button
              onClick={() => setCycle("monthly")}
              className={cn("px-3 py-1.5 rounded-lg transition-colors", cycle === "monthly" ? "bg-blue-600 text-white" : "text-slate-600")}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={cn("px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5", cycle === "annual" ? "bg-blue-600 text-white" : "text-slate-600")}
            >
              Annual <span className="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5">Save 20%</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p) => {
            const isSelected = p.code === selected
            const perMonth = planCyclePence(p, cycle)
            return (
              <div
                key={p.code}
                className={cn(
                  "relative rounded-2xl border p-4 flex flex-col transition-all",
                  isSelected ? "border-blue-600 ring-2 ring-blue-600/15 bg-blue-50/30" : "border-slate-200 hover:border-slate-300",
                )}
              >
                {p.isPopular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Most popular
                  </span>
                )}
                {isSelected && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Selected
                  </span>
                )}
                <h4 className="text-[14px] font-bold text-slate-900">{p.name}</h4>
                <div className="mt-1.5 flex items-baseline gap-1">
                  <span className="text-[22px] font-bold text-slate-900">{formatPence(perMonth)}</span>
                  <span className="text-[12px] text-slate-400">/mo</span>
                </div>
                {cycle === "annual" && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatPence(planAnnualPence(p))} billed annually</p>
                )}
                <ul className="mt-3 space-y-1.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelected(p.code)}
                  disabled={!canManageBilling}
                  className={cn(
                    "mt-4 w-full rounded-xl py-2 text-[13px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                    isSelected ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50",
                  )}
                >
                  {isSelected ? "Selected" : "Select plan"}
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-3"><SeedNotice source={source} /></div>
      </BillingCard>

      {/* 2. Customise with add-ons */}
      <BillingCard title="2. Customise with add-ons" description="Optional extras billed alongside your plan." icon={Sparkles}>
        <div className="divide-y divide-slate-100">
          {checkoutAddons.map((item) => {
            const a = addons.find((x) => x.code === item.code)!
            return (
              <div key={item.code} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800">{item.name}</p>
                  <p className="text-[11.5px] text-slate-400">
                    {item.code === "extra_listings"
                      ? `${formatPence(item.unitPricePence)}/property`
                      : item.unit === "credit_pack"
                        ? `from ${formatPence(item.unitPricePence)}`
                        : `${formatPence(item.unitPricePence)}/mo`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.enabled && item.code === "extra_listings" && (
                    <QtyStepper value={a.quantity} onChange={(q) => setAddon(item.code, { quantity: q })} min={0} suffix="props" disabled={!canManageBilling} />
                  )}
                  {a.enabled && item.unit === "credit_pack" && item.creditPacks && (
                    <select
                      value={a.quantity}
                      onChange={(e) => setAddon(item.code, { quantity: Number(e.target.value) })}
                      disabled={!canManageBilling}
                      className="rounded-xl border border-slate-200 text-[12px] px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    >
                      {item.creditPacks.map((cp, i) => (
                        <option key={cp.label} value={i}>{cp.label} — {formatPence(cp.pricePence)}</option>
                      ))}
                    </select>
                  )}
                  <Toggle
                    label={`Toggle ${item.name}`}
                    checked={a.enabled}
                    disabled={!canManageBilling}
                    onChange={(v) => setAddon(item.code, { enabled: v })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </BillingCard>

      {/* 3. Billing details */}
      <BillingCard title="3. Billing details" icon={CreditCard}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <p className="text-[12px] font-semibold text-slate-700 mb-2">Payment method</p>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-6 rounded bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">{card.brand.toUpperCase()}</div>
                <span className="text-[13px] text-slate-700">{card.brand} ending {card.last4}</span>
              </div>
              <BillingButton variant="ghost" className="text-[12px] px-3 py-1.5" onClick={() => alert("Card changes are made in the secure Stripe portal.")}>Change card</BillingButton>
            </div>

            <p className="text-[12px] font-semibold text-slate-700 mb-2 mt-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Invoice address</p>
            <div className="rounded-xl border border-slate-200 px-3.5 py-3">
              <p className="text-[13px] text-slate-700">{profile.billingName}</p>
              <p className="text-[12px] text-slate-500">{[profile.addressLine1, profile.city, profile.postcode, profile.country].filter(Boolean).join(", ")}</p>
              {profile.vatNumber && <p className="text-[11.5px] text-slate-400 mt-0.5">VAT {profile.vatNumber}</p>}
              <BillingButton variant="ghost" className="text-[12px] px-3 py-1.5 mt-2.5" onClick={() => setEditingAddress((v) => !v)}>{editingAddress ? "Close" : "Edit"}</BillingButton>
              {editingAddress && (
                <p className="text-[11.5px] text-slate-400 mt-2">Invoice address is managed in Workspace settings. <a className="text-blue-600 font-medium" href="/property-manager/workspace-settings/billing">Open settings</a></p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-[12px] font-semibold text-slate-700 mb-3 flex items-center gap-1.5"><ShoppingCart className="w-3.5 h-3.5" /> Order summary</p>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><span className="text-slate-500">{plan.name} ({cycle})</span><span className="font-medium text-slate-800">{formatPence(planCyclePence(plan, cycle))}/mo</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-medium text-slate-800">{formatPence(totals.subtotalPence)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax ({taxRatePercent(profile.taxRateBps)}%)</span><span className="font-medium text-slate-800">{formatPence(totals.taxPence)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-1"><span className="font-bold text-slate-900">Total / month</span><span className="font-bold text-slate-900">{formatPence(totals.totalPence)}</span></div>
              {cycle === "annual" && (
                <div className="flex justify-between text-[12px] text-emerald-700 pt-1"><span>Billed annually</span><span className="font-semibold">{formatPence(totals.annualBilledPence)}/yr</span></div>
              )}
            </div>
            <BillingButton
              variant={submitState === "done" ? "secondary" : "primary"}
              className="w-full mt-4"
              disabled={!canManageBilling || submitState === "processing"}
              onClick={proceed}
            >
              {submitState === "processing" ? "Processing…" : submitState === "done" ? "Checkout ready ✓" : "Proceed to checkout"}
            </BillingButton>
            {submitState === "done" && (
              <p className="text-[11.5px] text-emerald-700 mt-2 text-center">Order modelled. Payment is confirmed by webhook once Stripe is connected.</p>
            )}
            <p className="text-[11px] text-slate-400 mt-2 text-center">No charge is made during this build.</p>
          </div>
        </div>
      </BillingCard>
    </div>
  )
}
