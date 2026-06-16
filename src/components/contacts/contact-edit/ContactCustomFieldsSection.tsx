"use client"

import React from "react"
import { Controller } from "react-hook-form"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldLabel, TextInput, SectionCard, Toggle, SUPPLIER_CATEGORIES_EDIT, ENQUIRY_SOURCE_OPTIONS, APPLICANT_STATUS_OPTIONS } from "./shared"

interface SupplierProps {
  register: ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>
  control: import("react-hook-form").Control<Record<string, unknown>>
  watch: import("react-hook-form").UseFormWatch<Record<string, unknown>>
  selectedCategories: string[]
  toggleCategory: (cat: string) => void
}

export function SupplierDetailsSection({ register, control, watch, selectedCategories, toggleCategory }: SupplierProps) {
  const watchedEmergency = watch("emergency_available") as boolean
  const watchedPreferredSupplier = watch("preferred_supplier") as boolean

  return (
    <SectionCard title="Supplier Details">
      <div className="space-y-5">
        <div>
          <FieldLabel>Service Categories</FieldLabel>
          <div className="flex flex-wrap gap-2 mt-1">
            {SUPPLIER_CATEGORIES_EDIT.map(cat => (
              <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  selectedCategories.includes(cat)
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Controller
            control={control as import("react-hook-form").Control}
            name="emergency_available"
            render={({ field }) => <Toggle checked={field.value as boolean} onChange={field.onChange} label="Available for emergency call-outs" />}
          />
          <Controller
            control={control as import("react-hook-form").Control}
            name="preferred_supplier"
            render={({ field }) => <Toggle checked={field.value as boolean} onChange={field.onChange} label="Preferred supplier" />}
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <FieldLabel optional>Hourly Rate</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
              <TextInput {...register("hourly_rate")} type="number" placeholder="0.00" className="pl-7" />
            </div>
          </div>
          <div>
            <FieldLabel optional>Call-out Fee</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
              <TextInput {...register("callout_fee")} type="number" placeholder="0.00" className="pl-7" />
            </div>
          </div>
          <div>
            <FieldLabel optional>Insurance Expiry</FieldLabel>
            <TextInput {...register("insurance_expiry")} type="date" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

interface ApplicantProps {
  register: ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>
  watch: import("react-hook-form").UseFormWatch<Record<string, unknown>>
}

export function ApplicantDetailsSection({ register, watch }: ApplicantProps) {
  const watchedApplicantStatus = watch("applicant_status") as string

  return (
    <SectionCard title="Applicant Details">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel htmlFor="edit-enquiry-source">Enquiry Source</FieldLabel>
          <div className="relative">
            <select id="edit-enquiry-source" {...register("enquiry_source")} className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all">
              <option value="">Select source</option>
              {ENQUIRY_SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="edit-applicant-status">Applicant Status</FieldLabel>
          <div className="relative">
            <select id="edit-applicant-status" {...register("applicant_status")} className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all">
              {APPLICANT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {watchedApplicantStatus && (
            <div className="mt-2">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", APPLICANT_STATUS_OPTIONS.find(o => o.value === watchedApplicantStatus)?.colour ?? "bg-slate-100 text-slate-600")}>
                {APPLICANT_STATUS_OPTIONS.find(o => o.value === watchedApplicantStatus)?.label ?? watchedApplicantStatus}
              </span>
            </div>
          )}
        </div>
        <div>
          <FieldLabel optional>Budget Min</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
            <TextInput {...register("budget_min")} type="number" placeholder="500" className="pl-7" />
          </div>
        </div>
        <div>
          <FieldLabel optional>Budget Max</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">£</span>
            <TextInput {...register("budget_max")} type="number" placeholder="1500" className="pl-7" />
          </div>
        </div>
        <div>
          <FieldLabel optional>Desired Move Date</FieldLabel>
          <TextInput {...register("desired_move_date")} type="date" />
        </div>
        <div>
          <FieldLabel optional>Preferred Area</FieldLabel>
          <TextInput {...register("preferred_area")} placeholder="e.g. Birmingham City Centre" />
        </div>
      </div>
    </SectionCard>
  )
}
