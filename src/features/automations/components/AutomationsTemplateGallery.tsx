"use client"

import { ChevronRight, LayoutTemplate, Plus } from "lucide-react"
import { triggerLabel, actionLabel } from "@/lib/automation/catalogue"
import { RULE_TEMPLATES } from "@/lib/automation/templates"

export interface AutomationsTemplateGalleryProps {
  busy: string | null
  onInstall: (templateId: string) => void
}

/**
 * Categorised grid of rule templates available to install.
 * Templates are sourced from the shared RULE_TEMPLATES catalogue.
 * Clicking "Install" converts a template into a live smart rule.
 */
export default function AutomationsTemplateGallery({
  busy,
  onInstall,
}: AutomationsTemplateGalleryProps) {
  const cats = Array.from(new Set(RULE_TEMPLATES.map((t) => t.category)))

  return (
    <div className="space-y-6">
      {cats.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">{cat}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {RULE_TEMPLATES.filter((t) => t.category === cat).map((t) => (
              <div
                key={t.template_id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
                    <LayoutTemplate className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                </div>
                <p className="mt-2 flex-1 text-xs text-slate-500">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">
                      {triggerLabel(t.trigger_type)}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">
                      {actionLabel(t.action_type)}
                    </span>
                  </div>
                  <button
                    onClick={() => onInstall(t.template_id)}
                    disabled={busy === t.template_id}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-strong)] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
