"use client"

import React, { useMemo, useState, useTransition } from "react"
import {
  Sparkles, Plus, Zap, Inbox, History, LayoutTemplate, Play, Check, X as XIcon,
  ShieldCheck, AlertCircle, Power, Trash2, ChevronRight, CircleDot,
} from "lucide-react"
import { useWorkspace } from "@/providers/AuthProvider"
import { triggerLabel, actionLabel } from "@/lib/automation/catalogue"
import { RULE_TEMPLATES } from "@/lib/automation/templates"
import {
  setRuleEnabled, deleteRule, installTemplate, runEvaluation, approveRunAction, skipRunAction,
} from "@/lib/automation/actions"
import { useRules, useRuns } from "./_lib/useAutomations"
import { StatusChip, Chip, relativeTime } from "./_lib/ui"
import RuleBuilder from "./RuleBuilder"
import { MobileTabs, type MobileTabItem } from "@/components/mobile"

type Tab = "rules" | "inbox" | "activity" | "templates"

export default function AutomationsClient() {
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
    { id: "rules", label: "Rules", icon: Zap, badge: rules.length },
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.30)]"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Smart Rules</h1>
            <p className="text-sm text-slate-500">Automations that watch your portfolio and propose safe next steps — you stay in control.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEvaluate} disabled={busy === "evaluate"} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            <Play className="h-4 w-4" /> {busy === "evaluate" ? "Evaluating…" : "Run now"}
          </button>
          <button onClick={() => setShowBuilder(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-[0_2px_8px_rgba(37,99,235,0.30)] hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New rule
          </button>
        </div>
      </div>

      {/* Review-first banner */}
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800"><span className="font-semibold">Review-first.</span> Rules never take destructive or irreversible actions. They propose safe, reversible steps (a task, notification, draft, flag, or reminder) that you approve before anything happens.</p>
      </div>

      {/* KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Active rules" value={activeRules} sub={`${rules.length} total`} icon={Zap} tone="blue" />
        <KpiCard label="Pending review" value={pending.length} sub="awaiting approval" icon={Inbox} tone="amber" />
        <KpiCard label="Actions executed" value={executed} sub="all time" icon={Check} tone="emerald" />
        <KpiCard label="Runs (recent)" value={runs.length} sub="last 200" icon={History} tone="slate" />
      </div>

      {/* Tabs — desktop strip on md+, MobileTabs on phones */}
      <div className="mt-6 hidden md:flex items-center gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${tab === t.id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.badge != null && t.badge > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === t.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{t.badge}</span>}
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
        {tab === "rules" && <RulesTab rules={rules} loading={rulesLoading} busy={busy} onToggle={onToggle} onDelete={onDelete} onNew={() => setShowBuilder(true)} />}
        {tab === "inbox" && <InboxTab runs={pending} loading={runsLoading} busy={busy} onApprove={onApprove} onSkip={onSkip} />}
        {tab === "activity" && <ActivityTab runs={runs} loading={runsLoading} />}
        {tab === "templates" && <TemplatesTab busy={busy} onInstall={onInstall} />}
      </div>

      {showBuilder && <RuleBuilder onClose={() => setShowBuilder(false)} onCreated={() => { setShowBuilder(false); reloadRules(); flash("Rule created."); setTab("rules") }} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(0,0,0,0.30)]">{toast}</div>
      )}
    </div>
  )
}

/* ─── KPI card ─── */
function KpiCard({ label, value, sub, icon: Icon, tone }: { label: string; value: number; sub: string; icon: React.ElementType; tone: "blue" | "amber" | "emerald" | "slate" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600", slate: "bg-slate-100 text-slate-500",
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-3.5 w-3.5" /></span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  )
}

/* ─── Rules tab ─── */
function RulesTab({ rules, loading, busy, onToggle, onDelete, onNew }: {
  rules: ReturnType<typeof useRules>["rules"]; loading: boolean; busy: string | null
  onToggle: (id: string, enabled: boolean) => void; onDelete: (id: string) => void; onNew: () => void
}) {
  if (loading) return <SkeletonRows />
  if (rules.length === 0) return (
    <EmptyState icon={Zap} title="No rules yet" body="Create your first Smart Rule or install one from the template library." cta="New rule" onCta={onNew} />
  )
  return (
    <div className="space-y-3">
      {rules.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${r.enabled ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}><Zap className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">{r.name}</span>
                {r.review_required ? <Chip tone="blue">Review-first</Chip> : <Chip>Auto (safe)</Chip>}
                {r.template_id && <Chip tone="violet">Template</Chip>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{triggerLabel(r.trigger_type)}</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{actionLabel(r.action_type)}</span>
                {r.last_evaluated_at && <span className="ml-1 text-slate-400">· checked {relativeTime(r.last_evaluated_at)}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button onClick={() => onToggle(r.id, !r.enabled)} title={r.enabled ? "Disable" : "Enable"} className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${r.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
              <Power className="h-3.5 w-3.5" /> {r.enabled ? "On" : "Off"}
            </button>
            <button onClick={() => onDelete(r.id)} disabled={busy === r.id} aria-label="Delete rule" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Review inbox tab ─── */
function InboxTab({ runs, loading, busy, onApprove, onSkip }: {
  runs: ReturnType<typeof useRuns>["runs"]; loading: boolean; busy: string | null
  onApprove: (id: string) => void; onSkip: (id: string) => void
}) {
  if (loading) return <SkeletonRows />
  if (runs.length === 0) return <EmptyState icon={Inbox} title="Nothing to review" body="When a rule matches a record, the proposed action lands here for your approval." />
  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <div key={run.id} className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-600"><AlertCircle className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900">{run.context?.summary ?? "Rule match"}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{run.rule?.name}</span>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span>Proposes: {actionLabel(run.action?.action_type ?? run.rule?.action_type ?? "")}</span>
                <span className="text-slate-400">· {relativeTime(run.triggered_at)}</span>
              </div>
              {run.action?.payload && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{String((run.action.payload as Record<string, unknown>).title ?? (run.action.payload as Record<string, unknown>).subject ?? (run.action.payload as Record<string, unknown>).reason ?? "Action")}</span>
                  {(run.action.payload as Record<string, unknown>).body ? <div className="mt-0.5 text-slate-500">{String((run.action.payload as Record<string, unknown>).body)}</div> : null}
                </div>
              )}
            </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <button onClick={() => onSkip(run.id)} disabled={busy === run.id} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"><XIcon className="h-3.5 w-3.5" /> Skip</button>
              <button onClick={() => onApprove(run.id)} disabled={busy === run.id} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> {busy === run.id ? "…" : "Approve"}</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Activity tab (timeline) ─── */
function ActivityTab({ runs, loading }: { runs: ReturnType<typeof useRuns>["runs"]; loading: boolean }) {
  if (loading) return <SkeletonRows />
  if (runs.length === 0) return <EmptyState icon={History} title="No activity yet" body="Run your rules to start building an activity history." />
  return (
    <div className="relative space-y-1 pl-2">
      {runs.map((run) => (
        <div key={run.id} className="relative flex gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
          <div className="flex flex-col items-center">
            <CircleDot className="h-3.5 w-3.5 text-slate-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-slate-800">{run.context?.summary ?? "Rule match"}</span>
              <StatusChip status={run.status} />
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {run.rule?.name} · {actionLabel(run.action?.action_type ?? run.rule?.action_type ?? "")} · {relativeTime(run.triggered_at)}
              {run.error ? <span className="ml-1 text-red-500">— {run.error}</span> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Templates tab ─── */
function TemplatesTab({ busy, onInstall }: { busy: string | null; onInstall: (tid: string) => void }) {
  const cats = Array.from(new Set(RULE_TEMPLATES.map((t) => t.category)))
  return (
    <div className="space-y-6">
      {cats.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {RULE_TEMPLATES.filter((t) => t.category === cat).map((t) => (
              <div key={t.template_id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600"><LayoutTemplate className="h-4 w-4" /></span>
                  <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                </div>
                <p className="mt-2 flex-1 text-xs text-slate-500">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{triggerLabel(t.trigger_type)}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">{actionLabel(t.action_type)}</span>
                  </div>
                  <button onClick={() => onInstall(t.template_id)} disabled={busy === t.template_id} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> Install</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Shared bits ─── */
function EmptyState({ icon: Icon, title, body, cta, onCta }: { icon: React.ElementType; title: string; body: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-slate-400 shadow-sm"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>
      {cta && onCta && <button onClick={onCta} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> {cta}</button>}
    </div>
  )
}
function SkeletonRows() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
}
