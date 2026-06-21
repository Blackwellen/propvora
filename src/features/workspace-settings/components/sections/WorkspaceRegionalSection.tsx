"use client"

import React from "react"
import { SelectField } from "./shared"

const TIMEZONE_OPTIONS = [
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
]

const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP — British Pound (£)" },
  { value: "EUR", label: "EUR — Euro (€)" },
  { value: "USD", label: "USD — US Dollar ($)" },
  { value: "AUD", label: "AUD — Australian Dollar (A$)" },
  { value: "AED", label: "AED — UAE Dirham (د.إ)" },
]

const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
]

export interface WorkspaceRegionalFields {
  timezone: string
  currency: string
  dateFormat: string
}

export interface WorkspaceRegionalSectionProps {
  values: WorkspaceRegionalFields
  onChange: <K extends keyof WorkspaceRegionalFields>(field: K, value: WorkspaceRegionalFields[K]) => void
}

export function WorkspaceRegionalSection({ values, onChange }: WorkspaceRegionalSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Regional settings</h3>
      <p className="text-[12px] text-slate-400 mb-5">Timezone, currency and date formatting defaults</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <SelectField
            label="Timezone"
            value={values.timezone}
            onChange={(v) => onChange("timezone", v)}
            options={TIMEZONE_OPTIONS}
          />
        </div>
        <SelectField
          label="Default currency"
          value={values.currency}
          onChange={(v) => onChange("currency", v)}
          options={CURRENCY_OPTIONS}
        />
        <SelectField
          label="Date format"
          value={values.dateFormat}
          onChange={(v) => onChange("dateFormat", v)}
          options={DATE_FORMAT_OPTIONS}
        />
      </div>
    </div>
  )
}
