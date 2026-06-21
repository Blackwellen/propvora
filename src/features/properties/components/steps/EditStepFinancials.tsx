"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { useForm } from "react-hook-form"

interface FormData {
  target_rent: number
  [key: string]: unknown
}

interface EditStepFinancialsProps {
  register: ReturnType<typeof useForm<FormData>>["register"]
  errors: Record<string, { message?: string }>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
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

export function EditStepFinancials({ register, errors }: EditStepFinancialsProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Target monthly rent (£)" error={errors.target_rent?.message}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">£</span>
          <TextInput {...register("target_rent")} type="number" min={0} className="pl-7" placeholder="2850" />
        </div>
      </Field>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Tip: Operation profile affects metrics</p>
        <p className="text-xs text-blue-600">
          Rent-to-Rent properties will show landlord cost vs achievable rent. HMOs show per-room rent.
          Set your target here for the gross rent roll.
        </p>
      </div>
    </div>
  )
}
