"use client"

import React from "react"

export interface SessionExpiry {
  sessionTimeoutMinutes: number
  inviteExpiryHours: number
  magicLinkExpiryHours: number
  supplierLinkExpiryDays: number
}

export interface SessionExpirySectionProps {
  values: SessionExpiry
  onChange: <K extends keyof SessionExpiry>(field: K, value: SessionExpiry[K]) => void
}

const FIELDS: { label: string; field: keyof SessionExpiry; min: number; max: number }[] = [
  { label: "Session timeout (minutes)", field: "sessionTimeoutMinutes", min: 60, max: 10080 },
  { label: "Invite expiry (hours)", field: "inviteExpiryHours", min: 1, max: 168 },
  { label: "Magic link expiry (hours)", field: "magicLinkExpiryHours", min: 1, max: 72 },
  { label: "Supplier link expiry (days)", field: "supplierLinkExpiryDays", min: 1, max: 365 },
]

export function SessionExpirySection({ values, onChange }: SessionExpirySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Session &amp; Link Expiry</h3>
      <p className="text-[12px] text-slate-400 mb-4">
        Control how long sessions and invite links remain valid
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map(({ label, field, min, max }) => (
          <div key={field}>
            <label htmlFor={`sec-${field}`} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
              {label}
            </label>
            <input
              id={`sec-${field}`}
              type="number"
              min={min}
              max={max}
              value={values[field] as number}
              onChange={(e) => onChange(field, parseInt(e.target.value) || min)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
