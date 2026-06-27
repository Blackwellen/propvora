"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { useForm } from "react-hook-form"

interface FormData {
  address_line1: string
  address_line2?: string
  city: string
  postcode: string
  country: string
  [key: string]: unknown
}

interface EditStepLocationProps {
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
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] bg-white transition-all",
        className,
      )}
    />
  )
}

export function EditStepLocation({ register, errors }: EditStepLocationProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Address line 1" error={errors.address_line1?.message} required>
        <TextInput {...register("address_line1")} placeholder="12 Brunswick Road" />
      </Field>
      <Field label="Address line 2" error={errors.address_line2?.message}>
        <TextInput {...register("address_line2")} placeholder="(optional)" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" error={errors.city?.message} required>
          <TextInput {...register("city")} placeholder="Nottingham" />
        </Field>
        <Field label="Postcode" error={errors.postcode?.message} required>
          <TextInput {...register("postcode")} placeholder="NG1 4EX" />
        </Field>
      </div>
      <Field label="Country" error={errors.country?.message}>
        <TextInput {...register("country")} />
      </Field>
    </div>
  )
}
