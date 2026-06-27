"use client"

import React from "react"
import { ExternalLink } from "lucide-react"

export function StripeBillingPortalCard() {
  async function openPortal() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      if (!res.ok) throw new Error("not_configured")
      const { url } = await res.json()
      if (url) window.open(url, "_blank")
    } catch {
      alert(
        "Stripe billing portal is not configured. Set STRIPE_SECRET_KEY and STRIPE_PORTAL_RETURN_URL to enable it."
      )
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-2">Stripe Billing Portal</h3>
      <p className="text-[12.5px] text-slate-500 mb-4">
        Manage invoices, update payment methods, and download past receipts from a secure
        Stripe-hosted page.
      </p>
      <button
        type="button"
        onClick={openPortal}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--brand)] text-[var(--brand)] text-[13px] font-semibold hover:bg-[var(--brand-soft)] transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        Open billing portal
      </button>
      <p className="text-[11px] text-slate-400 mt-3">
        Powered by Stripe. Opens a secure billing management page. Requires Stripe configuration.
      </p>
    </div>
  )
}
