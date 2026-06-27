"use client"

import React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

// ---- Avatar helpers ----
const AVATAR_BG = ["bg-[var(--brand)]","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-teal-500"]
export function avatarBg(name: string): string { let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h); return AVATAR_BG[Math.abs(h)%AVATAR_BG.length] }
export function initials(name: string): string { const p=name.trim().split(/\s+/); return p.length===1?p[0].slice(0,2).toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase() }

// ---- Constants ----
export const CONTACT_TYPE_OPTIONS = [
  { value: "landlord", label: "Landlord" },
  { value: "tenant", label: "Tenant" },
  { value: "post_tenant", label: "Post Tenant" },
  { value: "applicant", label: "Applicant" },
  { value: "guarantor", label: "Guarantor" },
  { value: "supplier", label: "Supplier" },
  { value: "agent", label: "Agent" },
  { value: "local_authority", label: "Local Authority" },
  { value: "housing_association", label: "Housing Association" },
  { value: "legal", label: "Legal" },
  { value: "accountant", label: "Accountant" },
  { value: "other", label: "Other" },
]

export const CONTACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
]

import type { ContactType, HealthStatus } from "./types"

export const TYPE_BADGE: Record<ContactType, string> = {
  tenant:    "bg-emerald-100 text-emerald-700",
  landlord:  "bg-[var(--color-brand-100)] text-[var(--brand)]",
  supplier:  "bg-amber-100 text-amber-700",
  applicant: "bg-sky-100 text-sky-700",
  agent:     "bg-violet-100 text-violet-700",
  legal:     "bg-rose-100 text-rose-700",
  other:     "bg-slate-100 text-slate-600",
}

export const HEALTH_CONFIG: Record<HealthStatus, { label: string; dot: string; text: string }> = {
  healthy:    { label:"Healthy",    dot:"bg-emerald-500", text:"text-emerald-700" },
  risk:       { label:"At Risk",    dot:"bg-red-500",     text:"text-red-700"     },
  follow_up:  { label:"Follow Up",  dot:"bg-amber-500",   text:"text-amber-700"  },
  needs_data: { label:"Needs Data", dot:"bg-slate-400",   text:"text-slate-600"  },
}

// ---- Validators ----
export function validateEmail(v: string): string | null {
  if (!v.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Enter a valid email address"
}
export function validatePhone(v: string): string | null {
  if (!v.trim()) return null
  return /^[+]?[\d\s()-]{7,}$/.test(v.trim()) ? null : "Enter a valid phone number"
}

// ---- Shared UI primitives ----
export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      {children}
    </div>
  )
}

export function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  )
}

export function EmptyState({ icon: Icon, message, cta, onCta }: {
  icon: React.ElementType; message: string; cta?: string; onCta?: () => void
}) {
  return (
    <div className="text-center py-12">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 mb-3">{message}</p>
      {cta && (
        <Button variant="outline" size="sm" onClick={onCta} leftIcon={<Plus className="w-3.5 h-3.5" />}>{cta}</Button>
      )}
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, "success" | "danger" | "warning" | "default" | "sky"> = {
    paid: "success", active: "success", completed: "success", valid: "success",
    overdue: "danger", expired: "danger", risk: "danger",
    scheduled: "warning", pending: "warning", expiring: "warning",
    offer_drafted: "sky", viewing_needed: "sky",
  }
  return <Badge variant={map[status] ?? "default"} size="sm" dot>{status.replace(/_/g," ")}</Badge>
}

export function ContactDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-7 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-100 rounded w-36" />
            <div className="h-4 bg-slate-100 rounded w-52" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white px-4 py-3 h-14 bg-slate-100" />
        ))}
      </div>
    </div>
  )
}
