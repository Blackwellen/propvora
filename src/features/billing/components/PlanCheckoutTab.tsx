"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { Check, CreditCard, MapPin, Sparkles, ShoppingCart, ArrowRight } from "lucide-react"
import { startPlanCheckout, openBillingPortal } from "../data/stripe-link"
import { cn } from "@/lib/utils"
import { formatPence } from "@/lib/marketplace/money"
import { usePlans, useBillingProfile, usePaymentMethod, useBillingRole } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { computeTotals, planCyclePence, planAnnualPence, taxRatePercent } from "../data/calc"
import { type BillingCycle, type PlanCode } from "../data/types"
import { BillingCard, BillingButton, SeedNotice, PermissionNotice } from "./ui"

const ADDONS_HREF = "/property-manager/workspace/billing/add-ons"

export function PlanCheckoutTab() {
  const { data: plans, source } = usePlans()
  const { data: profile } = useBillingProfile()
  const { data: card } = usePaymentMethod()
  const { canManageBilling } = useBillingRole()

  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [selected, setSelected] = useState<PlanCode>("professional")
  const [submitState, setSubmitState] = useState<"idle" | "processing">("idle")
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [editingAddress, setEditingAddress] = useState(false)

  const plan = useMemo(() => plans.find((p) => p.code === selected) ?? plans[0], [plans, selected])
  // Plan-only totals. Add-ons are NOT charged at initial checkout — they require
  // an active subscription and are provisioned as Stripe subscription-items from
  // the Add-ons tab afterwards, so showing them in the "due now" total would be
  // misleading. The empty add-on list keeps this total exactly what Stripe bills.
  const totals = useMemo(
    () => computeTotals(plan, cycle, SEED_ADDON_CATALOG, [], profile.taxRateBps),
    [plan, cycle, profile.taxRateBps],
  )

  async function proceed() {
    setCheckoutError(null)
    setSubmitState("processing")
    try {
      // Real Stripe Checkout via /api/billing/checkout for the selected tier.
      await startPlanCheckout(selected, cycle)
      // On success the browser is redirected to Stripe; this line is unreached.
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Could not start checkout")
      setSubmitState("idle")
    }
  }

  async function manageCard() {
    setPortalError(null)
    try {
      await openBillingPortal()
    } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Card management is unavailable until billing is provisioned.")
    }
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
              className={cn("px-3 py-1.5 rounded-lg transition-colors", cycle === "monthly" ? "bg-[var(--brand)] text-white" : "text-slate-600")}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={cn("px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5", cycle === "annual" ? "bg-[var(--brand)] text-white" : "text-slate-600")}
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
                  isSelected ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/15 bg-[var(--brand-soft)]/30" : "border-slate-200 hover:border-slate-300",
                )}
              >
                {p.isPopular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-[var(--brand)] text-white text-[10px] font-bold px-2 py-0.5">
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
                    isSelected ? "bg-[var(--brand)] text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50",
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

      {/* 2. Add-ons (provisioned after subscribing) */}
      <BillingCard title="2. Add-ons" description="Optional extras you can enable once your plan is active." icon={Sparkles}>
        <div className="rounded-xl border border-[var(--color-brand-100)] bg-[var(--brand-soft)]/50 px-4 py-3.5">
          <p className="text-[13px] text-slate-700">
            Add-ons such as extra listings, AI credit packs and white-label are billed as
            subscription items and are added <span className="font-semibold">after</span> you
            subscribe — they&apos;re prorated onto your next invoice. Your total below is exactly
            what Stripe charges today.
          </p>
          <Link
            href={ADDONS_HREF}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--brand)] hover:text-[var(--brand-strong)]"
          >
            Browse add-ons <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </BillingCard>

      {/* 3. Billing details */}
      <BillingCard title="3. Billing details" icon={CreditCard}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <p className="text-[12px] font-semibold text-slate-700 mb-2">Payment method</p>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
              {card ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-6 rounded bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center">{card.brand.toUpperCase()}</div>
                  <span className="text-[13px] text-slate-700">{card.brand} ending {card.last4}</span>
                </div>
              ) : (
                <span className="text-[13px] text-slate-400">No payment method on file</span>
              )}
              <BillingButton variant="ghost" className="text-[12px] px-3 py-1.5" disabled={!canManageBilling} onClick={manageCard}>{card ? "Change card" : "Add card"}</BillingButton>
            </div>
            {portalError && <p className="text-[11px] text-amber-600 mt-1.5">{portalError}</p>}

            <p className="text-[12px] font-semibold text-slate-700 mb-2 mt-4 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Invoice address</p>
            <div className="rounded-xl border border-slate-200 px-3.5 py-3">
              <p className="text-[13px] text-slate-700">{profile.billingName}</p>
              <p className="text-[12px] text-slate-500">{[profile.addressLine1, profile.city, profile.postcode, profile.country].filter(Boolean).join(", ")}</p>
              {profile.vatNumber && <p className="text-[11.5px] text-slate-400 mt-0.5">VAT {profile.vatNumber}</p>}
              <BillingButton variant="ghost" className="text-[12px] px-3 py-1.5 mt-2.5" onClick={() => setEditingAddress((v) => !v)}>{editingAddress ? "Close" : "Edit"}</BillingButton>
              {editingAddress && (
                <p className="text-[11.5px] text-slate-400 mt-2">Invoice address is managed in Workspace settings. <a className="text-[var(--brand)] font-medium" href="/property-manager/workspace-settings/billing">Open settings</a></p>
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
              variant="primary"
              className="w-full mt-4"
              disabled={!canManageBilling || submitState === "processing"}
              onClick={proceed}
            >
              {submitState === "processing" ? "Redirecting to Stripe…" : "Proceed to checkout"}
            </BillingButton>
            {checkoutError && (
              <p className="text-[11.5px] text-amber-600 mt-2 text-center">{checkoutError}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-2 text-center">Secure payment is handled by Stripe. Includes a 7-day trial.</p>
          </div>
        </div>
      </BillingCard>
    </div>
  )
}
