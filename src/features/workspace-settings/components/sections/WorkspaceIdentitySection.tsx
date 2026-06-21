"use client"

import React from "react"
import { InputField, SelectField } from "./shared"

const WORKSPACE_TYPE_OPTIONS = [
  { value: "property_manager", label: "Property Manager" },
  { value: "letting_agent", label: "Letting Agent" },
  { value: "estate_agent", label: "Estate Agent" },
  { value: "housing_association", label: "Housing Association" },
  { value: "developer", label: "Property Developer" },
  { value: "landlord", label: "Private Landlord" },
  { value: "other", label: "Other" },
]

export interface WorkspaceIdentityFields {
  name: string
  workspaceType: string
  companyNumber: string
  vatNumber: string
}

export interface WorkspaceIdentitySectionProps {
  values: WorkspaceIdentityFields
  onChange: <K extends keyof WorkspaceIdentityFields>(field: K, value: WorkspaceIdentityFields[K]) => void
}

export function WorkspaceIdentitySection({ values, onChange }: WorkspaceIdentitySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Identity</h3>
      <p className="text-[12px] text-slate-400 mb-5">Your workspace name and organisation type</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Workspace name"
            value={values.name}
            onChange={(v) => onChange("name", v)}
            placeholder="e.g. Acme Property Management"
            required
          />
        </div>
        <SelectField
          label="Workspace type"
          value={values.workspaceType}
          onChange={(v) => onChange("workspaceType", v)}
          options={WORKSPACE_TYPE_OPTIONS}
        />
        <InputField
          label="Company number"
          value={values.companyNumber}
          onChange={(v) => onChange("companyNumber", v)}
          placeholder="e.g. 12345678"
        />
        <div className="sm:col-span-2">
          <InputField
            label="VAT number"
            value={values.vatNumber}
            onChange={(v) => onChange("vatNumber", v)}
            placeholder="e.g. GB123456789"
          />
        </div>
      </div>
    </div>
  )
}
