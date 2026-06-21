"use client"

/**
 * TenantPortalMaintenanceStep1
 *
 * Step 1 of the tenant repair reporting wizard: describe the issue.
 * Captures title, description and priority.
 */
import type { NewMaintenanceRequest } from "@/lib/portal/data-extra"

const PRIORITIES: NewMaintenanceRequest["priority"][] = ["low", "medium", "high", "urgent"]

interface Props {
  title: string
  description: string
  priority: NewMaintenanceRequest["priority"]
  onTitle: (v: string) => void
  onDescription: (v: string) => void
  onPriority: (v: NewMaintenanceRequest["priority"]) => void
}

export function TenantPortalMaintenanceStep1({ title, description, priority, onTitle, onDescription, onPriority }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-0.5">Step 1 — Describe the issue</h2>
        <p className="text-xs text-slate-500">Give your property manager a clear picture of the problem.</p>
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">What is the issue? *</label>
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="e.g. Leaking kitchen tap"
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Details (optional)</label>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          rows={4}
          placeholder="Where is it, when did it start, any access notes…"
          className="w-full bg-slate-50 rounded-xl px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-semibold text-slate-500 mb-1">Priority</label>
        <div className="flex gap-1.5 flex-wrap">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPriority(p)}
              className={`capitalize rounded-lg px-3 py-1.5 text-[12px] font-semibold border ${
                priority === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {priority === "urgent" ? "Emergency — affects safety or habitability" :
           priority === "high" ? "Serious issue needing prompt attention" :
           priority === "medium" ? "Standard repair, can be scheduled" :
           "Non-urgent, cosmetic or minor"}
        </p>
      </div>
    </div>
  )
}
