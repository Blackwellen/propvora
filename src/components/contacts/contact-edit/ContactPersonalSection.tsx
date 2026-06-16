"use client"

import React from "react"
import { Controller } from "react-hook-form"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldLabel, TextInput, SectionCard, CONTACT_TYPE_OPTIONS, STATUS_OPTIONS } from "./shared"

interface Props {
  register: ReturnType<import("react-hook-form").UseFormRegister<Record<string, unknown>>>
  control: import("react-hook-form").Control<Record<string, unknown>>
  watch: import("react-hook-form").UseFormWatch<Record<string, unknown>>
  errors: import("react-hook-form").FieldErrors
  showOrgFields: boolean
}

export function ContactPersonalSection({ register, control, watch, errors, showOrgFields }: Props) {
  const watchedStatus = watch("status") as string

  return (
    <SectionCard title="Contact Details">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <FieldLabel htmlFor="edit-contact-type">Contact Type</FieldLabel>
          <div className="relative">
            <select id="edit-contact-type" {...register("contact_type")} className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all">
              {CONTACT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="edit-status">Status</FieldLabel>
          <div className="relative">
            <select id="edit-status" {...register("status")} className="w-full h-10 pl-3 pr-8 rounded-lg text-sm border border-slate-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {watchedStatus && (
            <div className="mt-2">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_OPTIONS.find(o => o.value === watchedStatus)?.colour ?? "bg-slate-100 text-slate-600")}>
                {STATUS_OPTIONS.find(o => o.value === watchedStatus)?.label ?? watchedStatus}
              </span>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Entity Type</FieldLabel>
          <Controller
            control={control as import("react-hook-form").Control}
            name="entity_type"
            render={({ field }) => (
              <div className="flex gap-2">
                {(["person", "organisation"] as const).map(et => (
                  <button key={et} type="button" onClick={() => field.onChange(et)}
                    className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                      field.value === et ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}>
                    {et.charAt(0).toUpperCase() + et.slice(1)}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div className="sm:col-span-2">
          <FieldLabel>Full Name</FieldLabel>
          <TextInput {...register("full_name", { required: "Full name is required" })} placeholder="e.g. Kevin Walsh" />
          {(errors.full_name as { message?: string })?.message && (
            <p className="mt-1 text-xs text-red-600">{(errors.full_name as { message?: string }).message}</p>
          )}
        </div>

        {showOrgFields && (
          <div className="sm:col-span-2">
            <FieldLabel optional>Company / Organisation Name</FieldLabel>
            <TextInput {...register("company_name")} placeholder="Add organisation name" />
          </div>
        )}
      </div>
    </SectionCard>
  )
}
