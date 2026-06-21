"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { useForm } from "react-hook-form"

interface FormData {
  property_type: string
  operation_profile: string
  bedrooms: number
  bathrooms: number
  [key: string]: unknown
}

interface EditStepTypeProfileProps {
  register: ReturnType<typeof useForm<FormData>>["register"]
  errors: Record<string, { message?: string }>
  watch: ReturnType<typeof useForm<FormData>>["watch"]
  setValue: ReturnType<typeof useForm<FormData>>["setValue"]
}

const OPERATION_PROFILES = [
  "Long-Term Let", "Rent-to-Rent", "HMO", "Student Let",
  "Serviced Accommodation", "Holiday Let", "Build-to-Rent",
  "Social Housing", "Commercial", "Mixed Use", "Dev / Flip",
  "Co-Living", "Unassigned",
]

const PROPERTY_TYPES = [
  { value: "house",      label: "House" },
  { value: "flat",       label: "Flat / Apartment" },
  { value: "hmo",        label: "HMO" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use",  label: "Mixed Use" },
  { value: "land",       label: "Land" },
  { value: "other",      label: "Other" },
]

function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all",
        className,
      )}
    />
  )
}

function SelectInput({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer transition-all",
        className,
      )}
    />
  )
}

export function EditStepTypeProfile({ register, errors, watch, setValue }: EditStepTypeProfileProps) {
  const profile = watch("operation_profile")

  return (
    <div className="flex flex-col gap-5">
      <Field label="Property type" error={errors.property_type?.message} required>
        <SelectInput {...register("property_type")}>
          {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </SelectInput>
      </Field>

      <Field label="Operation profile" error={errors.operation_profile?.message} required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {OPERATION_PROFILES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue("operation_profile", p)}
              className={cn(
                "px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left",
                profile === p
                  ? "border-[#2563EB] bg-blue-50 text-[#2563EB] shadow-sm ring-1 ring-[#2563EB]/20"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bedrooms">
          <TextInput {...register("bedrooms")} type="number" min={0} />
        </Field>
        <Field label="Bathrooms">
          <TextInput {...register("bathrooms")} type="number" min={0} />
        </Field>
      </div>
    </div>
  )
}
