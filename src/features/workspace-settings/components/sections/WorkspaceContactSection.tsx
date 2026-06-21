"use client"

import React from "react"
import { InputField } from "./shared"

export interface WorkspaceContactFields {
  address: string
  city: string
  postcode: string
  phone: string
  website: string
  email: string
  supportEmail: string
}

export interface WorkspaceContactSectionProps {
  values: WorkspaceContactFields
  onChange: <K extends keyof WorkspaceContactFields>(field: K, value: WorkspaceContactFields[K]) => void
}

export function WorkspaceContactSection({ values, onChange }: WorkspaceContactSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Contact details</h3>
      <p className="text-[12px] text-slate-400 mb-5">Address and contact information for your workspace</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Street address"
            value={values.address}
            onChange={(v) => onChange("address", v)}
            placeholder="123 Example Street"
          />
        </div>
        <InputField
          label="City"
          value={values.city}
          onChange={(v) => onChange("city", v)}
          placeholder="London"
        />
        <InputField
          label="Postcode"
          value={values.postcode}
          onChange={(v) => onChange("postcode", v)}
          placeholder="SW1A 1AA"
        />
        <InputField
          label="Phone number"
          value={values.phone}
          onChange={(v) => onChange("phone", v)}
          type="tel"
          placeholder="+44 20 0000 0000"
        />
        <InputField
          label="Website"
          value={values.website}
          onChange={(v) => onChange("website", v)}
          type="url"
          placeholder="https://example.com"
        />
        <InputField
          label="Business email"
          value={values.email}
          onChange={(v) => onChange("email", v)}
          type="email"
          placeholder="hello@example.com"
        />
        <InputField
          label="Support email"
          value={values.supportEmail}
          onChange={(v) => onChange("supportEmail", v)}
          type="email"
          placeholder="support@example.com"
        />
      </div>
    </div>
  )
}
