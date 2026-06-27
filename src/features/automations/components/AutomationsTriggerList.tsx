"use client"

import { Zap, Plus } from "lucide-react"
import type { SmartRule } from "@/lib/automation/types"
import AutomationsRuleCard from "./AutomationsRuleCard"

interface AutomationsTriggerListProps {
  rules: SmartRule[]
  loading: boolean
  busy: string | null
  onToggle: (id: string, enabled: boolean) => void
  onDelete: (id: string) => void
  onNew: () => void
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  )
}

function EmptyRules({ onNew }: { onNew: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Zap className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">No automations yet</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Create your first automation or install one from the recipe library.
      </p>
      <button
        onClick={onNew}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-strong)]"
      >
        <Plus className="h-4 w-4" /> New automation
      </button>
    </div>
  )
}

/**
 * Renders the list of smart rules for the "Automations" tab.
 * Each row is an AutomationsRuleCard. Shows skeleton during load
 * and an empty state when no rules exist.
 */
export default function AutomationsTriggerList({
  rules,
  loading,
  busy,
  onToggle,
  onDelete,
  onNew,
}: AutomationsTriggerListProps) {
  if (loading) return <SkeletonRows />
  if (rules.length === 0) return <EmptyRules onNew={onNew} />

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <AutomationsRuleCard
          key={rule.id}
          rule={rule}
          busy={busy}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
