"use client"

import React from "react"
import { Controller } from "react-hook-form"
import { Plus } from "lucide-react"
import { FieldLabel, TextInput, SectionCard, PREFERRED_CONTACT_OPTIONS } from "./shared"
import { cn } from "@/lib/utils"

interface Props {
  register: import("react-hook-form").UseFormRegister<Record<string, unknown>>
  control: import("react-hook-form").Control<Record<string, unknown>>
  showSecondaryPhone: boolean
  setShowSecondaryPhone: (v: boolean) => void
  showWebsite: boolean
  setShowWebsite: (v: boolean) => void
  isSupplier: boolean
  isOrg: boolean
}

export function ContactRelationshipsSection({
  register, control, showSecondaryPhone, setShowSecondaryPhone, showWebsite, setShowWebsite, isSupplier, isOrg,
}: Props) {
  return (
    <SectionCard title="Communication">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput {...register("email")} type="email" placeholder="email@example.com" />
        </div>
        <div>
          <FieldLabel>Phone</FieldLabel>
          <TextInput {...register("phone")} type="tel" placeholder="07700 900123" />
        </div>

        {showSecondaryPhone ? (
          <div>
            <FieldLabel optional>Secondary Phone</FieldLabel>
            <TextInput {...register("secondary_phone")} type="tel" placeholder="07700 900456" />
          </div>
        ) : (
          <div className="flex items-end">
            <button type="button" onClick={() => setShowSecondaryPhone(true)} className="flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add secondary phone
            </button>
          </div>
        )}

        {(showWebsite || isSupplier || isOrg) ? (
          <div>
            <FieldLabel optional>Website</FieldLabel>
            <TextInput {...register("website")} type="url" placeholder="https://example.com" />
          </div>
        ) : (
          <div className="flex items-end">
            <button type="button" onClick={() => setShowWebsite(true)} className="flex items-center gap-1 text-xs text-[var(--brand)] hover:text-[var(--brand-strong)] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add website
            </button>
          </div>
        )}

        <div className="sm:col-span-2">
          <FieldLabel>Preferred Contact Method</FieldLabel>
          <Controller
            control={control as import("react-hook-form").Control}
            name="preferred_contact_method"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {PREFERRED_CONTACT_OPTIONS.map(opt => (
                  <button key={opt} type="button" onClick={() => field.onChange(opt)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                      field.value === opt ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </SectionCard>
  )
}
