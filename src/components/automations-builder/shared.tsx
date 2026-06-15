"use client"

// Shared premium primitives for the Automation v2 builders. Matches the styling
// of the existing Smart Rules section (slate/blue/violet, soft shadows, rounded
// xl cards). No Tailwind dark: classes anywhere.

import React from "react"
import Link from "next/link"
import { ShieldCheck, Sparkles, Lock, ArrowRight } from "lucide-react"

/** Review-first / AI-honesty banner shown on both builders. */
export function ReviewFirstBanner({ ai = false }: { ai?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm text-emerald-800">
        <span className="font-semibold">Review-first.</span>{" "}
        {ai
          ? "The assistant only proposes a draft you can edit. It never creates, saves, or runs an automation — you confirm everything. Nothing here is legal, financial, or tax advice."
          : "This builder proposes safe, reversible steps. Nothing is saved or run until you confirm, and matches land in your review inbox for approval."}
      </p>
    </div>
  )
}

/** Inline "preview only" pill for the dry-run panel. */
export function PreviewPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
      <Sparkles className="h-3 w-3" /> Preview — nothing was executed
    </span>
  )
}

/** Upgrade prompt shown when the workspace isn't entitled (gate blocked). */
export function UpgradePrompt({
  title,
  reason,
}: {
  title: string
  reason?: string
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Lock className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {reason ?? "This feature isn't included on your current plan."}
      </p>
      <Link
        href="/app/settings/billing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700"
      >
        View plans <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

/** Page header shared by both builders, mirroring the Smart Rules header. */
export function BuilderHeader({
  title,
  subtitle,
  icon: Icon = Sparkles,
  actions,
}: {
  title: string
  subtitle: string
  icon?: React.ElementType
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SegTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ElementType }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
            value === t.id
              ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t.icon && <t.icon className="h-4 w-4" />}
          {t.label}
        </button>
      ))}
    </div>
  )
}

export const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
export const labelClass = "mb-1 block text-xs font-medium text-slate-600"
