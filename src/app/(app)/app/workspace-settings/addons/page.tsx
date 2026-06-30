"use client"

import React from "react"
import { AddOnsTab } from "@/features/billing/components/AddOnsTab"

/**
 * Workspace Settings → Add-ons.
 *
 * Renders the canonical, fully-wired add-on surface (AddOnsTab). Each add-on is
 * driven by the real Stripe catalogue (src/lib/billing/plans.ts):
 *   - recurring add-ons → /api/billing/addons (mutates the subscription item, or
 *     starts a subscription-mode Checkout when the workspace has no live sub yet)
 *   - one-time packs (AI credits) → /api/billing/checkout/addon (payment-mode Checkout)
 * Add-ons with no configured Stripe price are honestly shown as unavailable.
 *
 * This replaces an earlier mock that only toggled local state and linked to the
 * subscription page without ever starting a purchase.
 */
export default function AddonsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Add-ons</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Extend your workspace with premium features</p>
      </div>
      <AddOnsTab />
    </div>
  )
}
