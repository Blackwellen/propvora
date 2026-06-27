"use client"

import { ChevronRight, X } from "lucide-react"

export interface BuilderTemplate {
  id: string
  name: string
  description: string
  category: string
  trigger_type: string
  trigger_config: Record<string, string>
  action_type: string
  action_config: Record<string, string>
  review_required: boolean
}

export interface AutomationsBuilderTemplatePanelProps {
  /** Ordered list of category strings derived from templates */
  templateCats: string[]
  /** All templates to render — filtered by category internally */
  templates: BuilderTemplate[]
  onLoad: (template: BuilderTemplate) => void
  onClose: () => void
}

/**
 * Collapsible panel that renders starter templates inside the rule builder.
 * Clicking a template loads its values into the parent form without saving.
 */
export default function AutomationsBuilderTemplatePanel({
  templateCats,
  templates,
  onLoad,
  onClose,
}: AutomationsBuilderTemplatePanelProps) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/60 px-6 py-4 shrink-0 overflow-y-auto max-h-72">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Starter templates — click to load into the builder
        </span>
        <button
          onClick={onClose}
          className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-slate-700"
          aria-label="Close template panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {templateCats.map((cat) => (
        <div key={cat} className="mb-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {cat}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates
              .filter((t) => t.category === cat)
              .map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onLoad(tpl)}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[var(--color-brand-300)] hover:bg-[var(--brand-soft)]/30 transition"
                >
                  <span className="text-xs font-semibold text-slate-800">{tpl.name}</span>
                  <span className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                    {tpl.description}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{tpl.trigger_type}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{tpl.action_type}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
