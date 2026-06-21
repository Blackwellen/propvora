"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { useForm } from "react-hook-form"

interface FormData {
  notes?: string
  [key: string]: unknown
}

interface EditStepNotesProps {
  register: ReturnType<typeof useForm<FormData>>["register"]
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white transition-all resize-none",
        className,
      )}
    />
  )
}

export function EditStepNotes({ register }: EditStepNotesProps) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Notes and context">
        <TextArea
          {...register("notes")}
          rows={6}
          placeholder="Management notes, purchase history, key contacts, access details…"
        />
      </Field>
    </div>
  )
}
