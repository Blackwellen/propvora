"use client"

import { ChevronRight, Power, Trash2, Zap } from "lucide-react"
import { triggerLabel, actionLabel } from "@/lib/automation/catalogue"
import { Chip } from "@/app/(app)/app/automations/_lib/ui"
import { relativeTime } from "@/app/(app)/app/automations/_lib/ui"
import type { SmartRule } from "@/lib/automation/types"

export interface AutomationsRuleCardProps {
  rule: SmartRule
  busy: string | null
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
}

export default function AutomationsRuleCard({ rule, busy, onToggle, onDelete }: AutomationsRuleCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            rule.enabled ? "bg-[var(--brand-soft)] text-[var(--brand)]" : "bg-slate-100 text-slate-400"
          }`}
        >
          <Zap className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">{rule.name}</span>
            {rule.review_required ? (
              <Chip tone="blue">Review-first</Chip>
            ) : (
              <Chip>Auto (safe)</Chip>
            )}
            {rule.template_id && <Chip tone="violet">Template</Chip>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{triggerLabel(rule.trigger_type)}</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="rounded bg-slate-100 px-1.5 py-0.5">{actionLabel(rule.action_type)}</span>
            {rule.last_evaluated_at && (
              <span className="ml-1 text-slate-400">- checked {relativeTime(rule.last_evaluated_at)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end shrink-0 sm:self-auto">
        <button
          onClick={() => onToggle(rule.id, !rule.enabled)}
          title={rule.enabled ? "Disable" : "Enable"}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
            rule.enabled
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-500"
          }`}
        >
          <Power className="h-3.5 w-3.5" /> {rule.enabled ? "On" : "Off"}
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          disabled={busy === rule.id}
          aria-label="Delete rule"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
