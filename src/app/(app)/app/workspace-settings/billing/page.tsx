"use client"

import React, { useState } from "react"
import { ExternalLink, CreditCard, Mail, FileText } from "lucide-react"

interface BillingForm {
  billingName: string
  billingEmail: string
  vatNumber: string
  address: string
  city: string
  postcode: string
  country: string
}

export default function BillingPage() {
  const [form, setForm] = useState<BillingForm>({
    billingName: "Propvora Demo Ltd",
    billingEmail: "billing@propvora.com",
    vatNumber: "GB123456789",
    address: "123 Example Street",
    city: "London",
    postcode: "EC1A 1BB",
    country: "United Kingdom",
  })
  const [saved, setSaved] = useState(false)

  const update = (key: keyof BillingForm, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-slate-900">Billing & Payment</h1>
        <p className="text-[13.5px] text-slate-500 mt-1">Manage your payment method and billing details</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Next Invoice",     value: "£79.00",            sub: "Due 1 January 2027",      icon: FileText,  colour: "#2563EB" },
          { label: "Payment Method",   value: "Visa ···· 4242",    sub: "Expires 12/2027",          icon: CreditCard,colour: "#059669" },
          { label: "Billing Contact",  value: "billing@propvora.com", sub: "Invoices sent here",   icon: Mail,      colour: "#D97706" },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.colour + "15" }}>
                  <div style={{ color: card.colour }}><Icon className="w-4 h-4" /></div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
              </div>
              <p className="text-[14px] font-bold text-slate-900">{card.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Payment Method</h3>
        <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50">
          <div className="w-12 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">VISA</span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-slate-800">Visa ending 4242</p>
            <p className="text-[11px] text-slate-400">Expires 12/2027 · Primary</p>
          </div>
          <button className="text-[12px] text-[#2563EB] font-semibold hover:text-[#1d4ed8] transition-colors">
            Update
          </button>
        </div>
        <button className="mt-3 text-[12px] text-slate-500 font-medium hover:text-slate-700 transition-colors">
          + Add another payment method
        </button>
      </div>

      {/* Billing details form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Billing Details</h3>
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
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
          >
            {saved ? "Saved" : "Save billing details"}
          </button>
          {saved && <p className="text-[12px] text-emerald-600 font-medium">Changes saved successfully</p>}
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
