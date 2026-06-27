"use client"

import React from "react"
import { CheckCircle, AlertCircle } from "lucide-react"

export interface BillingFormFields {
  billingName: string
  billingEmail: string
  vatNumber: string
  address: string
  city: string
  postcode: string
  country: string
}

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export interface BillingDetailsFormProps {
  form: BillingFormFields
  loading: boolean
  saveStatus: SaveStatus
  saveError: string | null
  onUpdate: (key: keyof BillingFormFields, value: string) => void
  onSave: () => void
}

const COUNTRY_OPTIONS = [
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Ireland",
]

export function BillingDetailsForm({
  form,
  loading,
  saveStatus,
  saveError,
  onUpdate,
  onSave,
}: BillingDetailsFormProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4">Billing Details</h3>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              { label: "Billing name", key: "billingName" as const, placeholder: "Company or individual name" },
              { label: "Billing email", key: "billingEmail" as const, placeholder: "billing@example.com" },
              { label: "VAT / Tax number", key: "vatNumber" as const, placeholder: "e.g. GB123456789", fullWidth: true },
            ] as { label: string; key: keyof BillingFormFields; placeholder: string; fullWidth?: boolean }[]
          ).map((f) => (
            <div key={f.key} className={f.fullWidth ? "sm:col-span-2" : ""}>
              <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">{f.label}</label>
              <input
                type="text"
                value={form[f.key]}
                onChange={(e) => onUpdate(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
              />
            </div>
          ))}

          <div className="sm:col-span-2">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Street address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => onUpdate("address", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => onUpdate("city", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Postcode</label>
            <input
              type="text"
              value={form.postcode}
              onChange={(e) => onUpdate("postcode", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[12px] font-semibold text-slate-700 block mb-1.5">Country</label>
            <select
              value={form.country}
              onChange={(e) => onUpdate("country", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)] transition-all"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onSave}
          disabled={loading || saveStatus === "saving"}
          className="px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[13px] font-semibold hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
  )
}
