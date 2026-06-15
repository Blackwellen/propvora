"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutTemplate, Plus, ChevronRight, ShieldCheck, Check } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { RULE_TEMPLATES, type RuleTemplate } from "@/lib/automation/templates"
import { triggerLabel, actionLabel } from "@/lib/automation/catalogue"
import { ResponsiveTable } from "@/components/mobile"
import { OpsEmptyState } from "./ui"

const CATEGORIES = ["All", "Compliance", "Tenancy", "Finance", "Planning", "Maintenance"] as const

export default function TemplateGallery() {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const router = useRouter()

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All")
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [installed, setInstalled] = useState<Set<string>>(new Set())

  function flash(msg: string) { setToast(msg); window.setTimeout(() => setToast(null), 3500) }

  const filtered = useMemo(
    () => (category === "All" ? RULE_TEMPLATES : RULE_TEMPLATES.filter((t) => t.category === category)),
    [category],
  )

  // "Use template" → create a DRAFT definition via the definitions API. The
  // definition is created DISABLED (a draft) so nothing runs until the user
  // reviews + enables it. Falls through to a clear message on any failure — it
  // never claims success it didn't get.
  async function useTemplate(t: RuleTemplate) {
    setBusy(t.template_id)
    try {
      const res = await fetch("/api/automations/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          source: "builder",
          definition: {
            name: t.name,
            description: t.description,
            trigger_type: t.trigger_type,
            trigger_config: t.trigger_config,
            conditions: [],
            action_type: t.action_type,
            action_config: t.action_config,
            review_required: t.review_required,
            // Draft: created disabled so it cannot run until reviewed + enabled.
            enabled: false,
          },
        }),
      })
      const json = await res.json()
      if (res.status === 402) { flash(json.error ?? "Automation isn't on your plan."); return }
      if (!res.ok || !json.ok) { flash(json.error ?? "Couldn't create the draft."); return }
      setInstalled((prev) => new Set(prev).add(t.template_id))
      flash("Draft created — review and enable it in Automations.")
    } catch {
      flash("Couldn't create the draft. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Review-first templates.</span> Using a template creates a DRAFT automation that
          starts disabled. Nothing runs until you review it and switch it on.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === c
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <OpsEmptyState icon={LayoutTemplate} title="No templates" body="There are no templates in this category yet." />
      ) : (
        <ResponsiveTable
          rows={filtered}
          mobile={{
            getKey: (t) => t.template_id,
            title: (t) => <span className="font-semibold text-slate-900">{t.name}</span>,
            subtitle: (t) => <span className="text-xs text-slate-500">{t.description}</span>,
            badge: (t) => <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">{t.category}</span>,
            fields: [
              { label: "Trigger", render: (t) => triggerLabel(t.trigger_type) },
              { label: "Action", render: (t) => actionLabel(t.action_type) },
            ],
            actions: (t) => (
              <button
                onClick={() => useTemplate(t)}
                disabled={busy === t.template_id}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {installed.has(t.template_id) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {installed.has(t.template_id) ? "Added" : busy === t.template_id ? "…" : "Use"}
              </button>
            ),
          }}
        >
          {/* Desktop: card grid */}
          <div className="hidden grid-cols-1 gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <div key={t.template_id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600"><LayoutTemplate className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                </div>
                <p className="mt-2 flex-1 text-xs text-slate-500">{t.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">{triggerLabel(t.trigger_type)}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">{actionLabel(t.action_type)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">{t.category}</span>
                  <button
                    onClick={() => useTemplate(t)}
                    disabled={busy === t.template_id}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {installed.has(t.template_id) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {installed.has(t.template_id) ? "Added" : busy === t.template_id ? "…" : "Use template"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveTable>
      )}

      <div className="pt-1">
        <button
          onClick={() => router.push("/app/automations")}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View your automations →
        </button>
      </div>

      {toast && (
        <div className="fixed left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.30)] bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  )
}
