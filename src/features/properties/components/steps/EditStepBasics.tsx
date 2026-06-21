"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { useForm } from "react-hook-form"

interface FormData {
  name: string
  status: string
  [key: string]: unknown
}

const STATUSES = [
  { value: "active",      label: "Active" },
  { value: "vacant",      label: "Void" },
  { value: "under_works", label: "Off Market" },
  { value: "archived",    label: "Archived" },
]

interface EditStepBasicsProps {
  register: ReturnType<typeof useForm<FormData>>["register"]
  errors: Record<string, { message?: string }>
}

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

export function EditStepBasics({ register, errors }: EditStepBasicsProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Property name" error={errors.name?.message} required>
        <TextInput {...register("name")} placeholder="e.g. Brunswick Road HMO" />
      </Field>
      <Field label="Status" error={errors.status?.message} required>
        <SelectInput {...register("status")}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </SelectInput>
      </Field>
    </div>
  )
}
