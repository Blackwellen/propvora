"use client"

import React, { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Sparkles, Plus, Zap, Inbox, History, LayoutTemplate, Play, ShieldCheck, Wand2 } from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { setRuleEnabled, deleteRule, installTemplate, runEvaluation, approveRunAction, skipRunAction } from "@/lib/automation/actions"
import { useRules, useRuns } from "./_lib/useAutomations"
import RuleBuilder from "./RuleBuilder"
import { MobileTabs, type MobileTabItem } from "@/components/mobile"
import AutomationsTriggerList from "@/features/automations/components/AutomationsTriggerList"
import AutomationsActionPanel from "@/features/automations/components/AutomationsActionPanel"
import AutomationsActivityFeed from "@/features/automations/components/AutomationsActivityFeed"
import AutomationsTemplateGallery from "@/features/automations/components/AutomationsTemplateGallery"
import AutomationsKpiStrip from "@/features/automations/components/AutomationsKpiStrip"

type Tab = "rules" | "inbox" | "activity" | "templates"

export default function AutomationsClient({
  canvasEnabled = false,
}: {
  /** Whether the canvasLite flag is ON — controls Canvas shortcut button visibility. */
  canvasEnabled?: boolean
}) {
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id
  const { rules, loading: rulesLoading, reload: reloadRules } = useRules(workspaceId)
  const { runs, loading: runsLoading, reload: reloadRuns } = useRuns(workspaceId)
  const [tab, setTab] = useState<Tab>("rules")
  const [showBuilder, setShowBuilder] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const pending = useMemo(() => runs.filter((r) => r.status === "pending_review"), [runs])
  const executed = useMemo(() => runs.filter((r) => r.status === "executed").length, [runs])
  const activeRules = useMemo(() => rules.filter((r) => r.enabled).length, [rules])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }
  function reloadAll() { void reloadRules(); void reloadRuns() }

  async function onEvaluate() {
    setBusy("evaluate")
    try {
      const s = await runEvaluation()
      flash(`Evaluated ${s.rulesEvaluated} rule(s): ${s.runsCreated} new run(s), ${s.pendingReview} pending review.`)
      reloadAll()
    } catch (e) { flash(e instanceof Error ? e.message : "Evaluation failed") }
    finally { setBusy(null) }
  }
  async function onApprove(id: string) {
    setBusy(id)
    try { const r = await approveRunAction(id); flash(r.ok ? "Action executed." : (r.error ?? "Failed")); reloadAll() }
    finally { setBusy(null) }
  }
  async function onSkip(id: string) {
    setBusy(id)
    try { await skipRunAction(id); flash("Run skipped."); reloadAll() }
    finally { setBusy(null) }
  }
  async function onToggle(id: string, enabled: boolean) {
    startTransition(async () => { await setRuleEnabled(id, enabled); reloadRules() })
  }
  async function onDelete(id: string) {
    setBusy(id)
    try { await deleteRule(id); flash("Rule deleted."); reloadAll() }
    finally { setBusy(null) }
  }
  async function onInstall(tid: string) {
    setBusy(tid)
    try { await installTemplate(tid); flash("Template installed as a rule."); reloadRules(); setTab("rules") }
    finally { setBusy(null) }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "rules", label: "Automations", icon: Zap, badge: rules.length },
    { id: "inbox", label: "Review inbox", icon: Inbox, badge: pending.length },
    { id: "activity", label: "Activity", icon: History },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
  ]

  const mobileTabItems: MobileTabItem[] = tabs.map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    badge: t.badge != null && t.badge > 0 ? t.badge : undefined,
  }))

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Automations</h1>
            <p className="text-sm text-slate-500">Automations that watch your portfolio and propose safe next steps — you stay in control.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onEvaluate} disabled={busy === "evaluate"} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            <Play className="h-4 w-4" /> {busy === "evaluate" ? "Evaluating…" : "Run now"}
          </button>
          <Link href="/property-manager/automations/ai-builder" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Wand2 className="h-4 w-4 text-violet-500" /> AI Builder
          </Link>
          {canvasEnabled && (
            <Link href="/property-manager/automations/canvas" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              <LayoutTemplate className="h-4 w-4 text-[var(--brand)]" /> Canvas
            </Link>
          )}
          <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3.5 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-[var(--brand-strong)]">
            <Plus className="h-4 w-4" /> New automation
          </button>
        </div>
      </div>

      {/* Review-first banner */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Review-first.</span> Rules never take destructive or irreversible actions. They propose safe, reversible steps (a task, notification, draft, flag, or reminder) that you approve before anything happens.
        </p>
      </div>

      {/* KPI strip */}
      <div className="mt-5">
        <AutomationsKpiStrip
          activeRules={activeRules}
          totalRules={rules.length}
          pendingCount={pending.length}
          executedCount={executed}
          recentRuns={runs.length}
        />
      </div>

      {/* Tabs — desktop strip on md+, MobileTabs on phones */}
      <div className="mt-6 hidden md:flex items-center gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${tab === t.id ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.badge != null && t.badge > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === t.id ? "bg-[var(--color-brand-100)] text-[var(--brand)]" : "bg-slate-100 text-slate-500"}`}>{t.badge}</span>}
          </button>
        ))}
      </div>
      <div className="mt-6 md:hidden">
        <MobileTabs
          tabs={mobileTabItems}
          value={tab}
          onChange={(id) => setTab(id as Tab)}
          aria-label="Automation sections"
        />
      </div>

      <div className="mt-5">
        {tab === "rules" && (
          <AutomationsTriggerList
            rules={rules}
            loading={rulesLoading}
            busy={busy}
            onToggle={onToggle}
            onDelete={onDelete}
            onNew={() => setShowBuilder(true)}
          />
        )}
        {tab === "inbox" && (
          <AutomationsActionPanel
            runs={pending}
            loading={runsLoading}
            busy={busy}
            onApprove={onApprove}
            onSkip={onSkip}
          />
        )}
        {tab === "activity" && (
          <AutomationsActivityFeed runs={runs} loading={runsLoading} />
        )}
        {tab === "templates" && (
          <AutomationsTemplateGallery busy={busy} onInstall={onInstall} />
        )}
      </div>

      {showBuilder && (
        <RuleBuilder
          onClose={() => setShowBuilder(false)}
          onCreated={() => { setShowBuilder(false); reloadRules(); flash("Rule created."); setTab("rules") }}
        />
      )}

      {toast && (
        <div className="fixed left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.30)] bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  )
}
