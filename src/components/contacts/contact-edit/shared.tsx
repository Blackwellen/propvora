"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { ContactType, ContactStatus } from "@/types/database"

export const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: "landlord",            label: "Landlord" },
  { value: "tenant",              label: "Tenant" },
  { value: "post_tenant",         label: "Post-Tenant" },
  { value: "applicant",           label: "Applicant" },
  { value: "guarantor",           label: "Guarantor" },
  { value: "supplier",            label: "Supplier" },
  { value: "agent",               label: "Agent" },
  { value: "local_authority",     label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "legal",               label: "Legal" },
  { value: "accountant",          label: "Accountant" },
  { value: "insurer",             label: "Insurer" },
  { value: "utility_provider",    label: "Utility Provider" },
  { value: "broadband",           label: "Broadband" },
  { value: "cleaning",            label: "Cleaning" },
  { value: "maintenance",         label: "Maintenance" },
  { value: "emergency_contractor","label": "Emergency Contractor" } as { value: ContactType; label: string },
  { value: "investor",            label: "Investor" },
  { value: "affiliate",           label: "Affiliate" },
  { value: "other",               label: "Other" },
]

export const STATUS_OPTIONS: { value: ContactStatus; label: string; colour: string }[] = [
  { value: "active",   label: "Active",   colour: "bg-emerald-100 text-emerald-700" },
  { value: "inactive", label: "Inactive", colour: "bg-amber-100 text-amber-700" },
  { value: "archived", label: "Archived", colour: "bg-slate-100 text-slate-600" },
]

export const PREFERRED_CONTACT_OPTIONS = ["Email", "Phone", "WhatsApp", "Post"]

export const SUPPLIER_CATEGORIES_EDIT = [
  "Plumbing", "Electrical", "Gas/Heating", "Cleaning", "Gardening",
  "Handyman", "Locksmith", "Pest Control", "Waste Removal",
  "Broadband/Telecoms", "Utilities", "Inventory Clerk", "Inspection",
  "Compliance", "Decorator", "Builder", "Emergency Repairs", "Other",
]

export const ENQUIRY_SOURCE_OPTIONS = [
  "Website", "Rightmove", "Zoopla", "OpenRent", "Referral",
  "Phone", "Walk-in", "Social", "Other",
]

export const APPLICANT_STATUS_OPTIONS: { value: string; label: string; colour: string }[] = [
  { value: "new_enquiry",         label: "New Enquiry",         colour: "bg-sky-100 text-sky-700" },
  { value: "viewing_needed",      label: "Viewing Needed",      colour: "bg-violet-100 text-violet-700" },
  { value: "viewing_booked",      label: "Viewing Booked",      colour: "bg-[var(--color-brand-100)] text-[var(--brand)]" },
  { value: "application_pending", label: "Application Pending", colour: "bg-amber-100 text-amber-700" },
  { value: "converted",           label: "Converted",           colour: "bg-emerald-100 text-emerald-700" },
  { value: "lost",                label: "Lost",                colour: "bg-red-100 text-red-700" },
  { value: "archived",            label: "Archived",            colour: "bg-slate-100 text-slate-600" },
]

export function FieldLabel({ children, optional, htmlFor }: { children: React.ReactNode; optional?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {optional && <span className="ml-1 text-xs font-normal text-slate-400">(optional)</span>}
    </label>
  )
}

export function TextInput({ type = "text", placeholder, className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={cn(
        "w-full h-10 px-3 rounded-lg text-sm border border-slate-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]",
        "transition-all placeholder:text-slate-400",
        className,
      )}
      {...rest}
    />
  )
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
      <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative w-9 h-5 rounded-full transition-colors duration-200", checked ? "bg-[var(--brand)]" : "bg-slate-300")}
      >
        <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}
