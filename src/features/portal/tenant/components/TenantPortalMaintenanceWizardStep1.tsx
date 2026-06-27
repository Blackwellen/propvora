"use client"

import { useState } from "react"

interface TenantPortalMaintenanceWizardStep1Props {
  title: string
  onTitleChange: (v: string) => void
  description: string
  onDescriptionChange: (v: string) => void
  onNext: () => void
}

export function TenantPortalMaintenanceWizardStep1({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  onNext,
}: TenantPortalMaintenanceWizardStep1Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
          What&apos;s the issue?
        </label>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Leaking kitchen tap"
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
      </div>
      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">
          Details (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Where is it, when did it start, any access notes…"
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
      </div>
      <button
        onClick={onNext}
        disabled={!title.trim()}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold text-white bg-[#0D1B2A] hover:bg-[#0b1622] disabled:bg-slate-300 transition-colors"
      >
        Next
      </button>
    </div>
  )
}
