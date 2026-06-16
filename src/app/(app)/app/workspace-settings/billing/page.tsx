"use client"

import React, { useEffect, useState } from "react"
import { ExternalLink, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import { openBillingPortal } from "@/lib/billing/checkout"

interface BillingForm {
  billingName: string
  billingEmail: string
  vatNumber: string
  address: string
  city: string
  postcode: string
  country: string
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

const DEFAULT_FORM: BillingForm = {
  billingName: "",
  billingEmail: "",
  vatNumber: "",
  address: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
}

export default function BillingPage() {
  const [form, setForm] = useState<BillingForm>(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [portalError, setPortalError] = useState<string | null>(null)

  // Hydrate form from DB on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/workspace/billing-details")
        if (!res.ok) return
        const { billingDetails } = await res.json()
        if (!cancelled && billingDetails) {
          setForm({
            billingName: billingDetails.billingName ?? "",
            billingEmail: billingDetails.billingEmail ?? "",
            vatNumber: billingDetails.vatNumber ?? "",
            address: billingDetails.address ?? "",
            city: billingDetails.city ?? "",
            postcode: billingDetails.postcode ?? "",
            country: billingDetails.country ?? "United Kingdom",
          })
        }
      } catch {
        // Non-fatal — leave form at defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const update = (key: keyof BillingForm, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setSaveStatus("idle")
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaveStatus("saving")
    setSaveError(null)
    try {
      const res = await fetch("/api/workspace/billing-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? "Save failed")
      }
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 4000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save billing details")
      setSaveStatus("error")
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Billing & Payment</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Manage your payment method and billing details</p>
      </div>

      {/* Payment method — managed in the Stripe portal (PCI-compliant) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#2563EB]/10">
            <CreditCard className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Payment Method</h3>
        </div>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Cards and payment methods are stored securely by Stripe. Add, update or remove a
          card from the Stripe billing portal — Propvora never sees your full card details.
        </p>
        <button
          onClick={async () => {
            setPortalError(null)
            try { await openBillingPortal() } catch (e) { setPortalError(e instanceof Error ? e.message : "Portal unavailable") }
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Manage payment methods
        </button>
        {portalError && <p className="text-[11px] text-red-500 mt-2">{portalError}</p>}
      </div>

      {/* Billing details form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Billing Details</h3>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Billing name",    key: "billingName" as const,  placeholder: "Company or individual name" },
              { label: "Billing email",   key: "billingEmail" as const, placeholder: "billing@example.com"         },
              { label: "VAT / Tax number",key: "vatNumber" as const,    placeholder: "e.g. GB123456789"            },
            ].map(field => (
              <div key={field.key} className={field.key === "vatNumber" ? "sm:col-span-2" : ""}>
                <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={e => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                />
              </div>
            ))}

            <div className="sm:col-span-2">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Street address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => update("address", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                onChange={e => update("city", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Postcode</label>
              <input
                type="text"
                value={form.postcode}
                onChange={e => update("postcode", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Country</label>
              <select
                value={form.country}
                onChange={e => update("country", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              >
                <option>United Kingdom</option>
                <option>United States</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>Ireland</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={loading || saveStatus === "saving"}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Save billing details"}
          </button>

          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Changes saved successfully
            </span>
          )}
          {saveStatus === "error" && saveError && (
            <span className="flex items-center gap-1.5 text-[12px] text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {saveError}
            </span>
          )}
        </div>
      </div>

      {/* Stripe portal */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-2">Stripe Billing Portal</h3>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Manage invoices, update payment methods, and download past receipts from a secure Stripe-hosted page.
        </p>
        <button
          onClick={async () => {
            try {
              const res = await fetch("/api/billing/portal", { method: "POST" })
              if (!res.ok) throw new Error("not_configured")
              const { url } = await res.json()
              if (url) window.open(url, "_blank")
            } catch {
              alert("Stripe billing portal is not configured. Set STRIPE_SECRET_KEY and STRIPE_PORTAL_RETURN_URL to enable it.")
            }
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#2563EB] text-[#2563EB] text-[13px] font-semibold hover:bg-blue-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open billing portal
        </button>
        <p className="text-[11px] text-slate-400 mt-3">Powered by Stripe. Opens a secure billing management page. Requires Stripe configuration.</p>
      </div>
    </div>
  )
}
