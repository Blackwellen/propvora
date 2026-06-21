"use client"

import { Filter } from "lucide-react"
import type { TriggerDef } from "@/lib/automation/catalogue"

export interface AutomationsConditionBuilderProps {
  /** The resolved trigger catalogue entry */
  trigger: TriggerDef
  /** Current config values keyed by field.key */
  triggerCfg: Record<string, string>
  /** Setter — merge a single key update */
  onChange: (key: string, value: string) => void
}

/**
 * Step 1 of the rule builder — renders the configurable threshold fields
 * for the selected trigger. Each field becomes a labelled text/number input.
 * Shows a friendly message when the trigger has no configurable conditions.
 */
export default function AutomationsConditionBuilder({
  trigger,
  triggerCfg,
  onChange,
}: AutomationsConditionBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="h-4 w-4 text-blue-500" /> Conditions
      </div>
      <p className="text-xs text-slate-500">
        Tune the trigger threshold. These define exactly which records match.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {trigger.configFields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {f.label}
              {f.suffix ? ` (${f.suffix})` : ""}
            </label>
            <input
              value={triggerCfg[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              type={f.kind === "number" ? "number" : "text"}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {f.help && <p className="mt-1 text-[11px] text-slate-400">{f.help}</p>}
          </div>
        ))}
        {trigger.configFields.length === 0 && (
          <p className="text-sm text-slate-400">No conditions for this trigger.</p>
        )}
      </div>
    </div>
  )
}
