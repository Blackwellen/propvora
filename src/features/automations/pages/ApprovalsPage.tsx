"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSectionRouter } from "@/components/sections/SectionBasePath"
import { CheckCircle2, ChevronDown, Clock, Loader2, ShieldCheck, ThumbsDown, XCircle } from "lucide-react"
import AutomationsModuleShell from "../components/AutomationsModuleShell"
import AutomationsKpiCard from "../components/AutomationsKpiCard"
import AutomationsDataTable, { type DataColumn } from "../components/AutomationsDataTable"
import { AutomationsRiskBadge } from "../components/AutomationsBadges"
import { Btn, Card, Modal, useToast } from "../components/primitives"
import { useAutomationApprovals } from "../data/hooks"
import { useWorkspace } from "@/providers/AuthProvider"
import type { ApprovalRow } from "../data/types"

export default function ApprovalsPage() {
  const toast = useToast()
  const router = useSectionRouter()
  const { workspace } = useWorkspace()
  const workspaceId = workspace?.id ?? ""
  const { data: approvals, loading, reload } = useAutomationApprovals()
  const [tab, setTab] = useState("all")
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<ApprovalRow | undefined>(undefined)

  // Sync the detail panel to the first approval once the async fetch resolves.
  useEffect(() => {
    setActive((cur) => cur ?? approvals[0])
  }, [approvals])
  // Tab counts derive from the live approvals queue (honest 0 when empty).
  const highCount = approvals.filter((a) => a.risk === "high" || a.risk === "critical").length
  const TABS = [
    { id: "all", label: "All", count: approvals.length },
    { id: "high", label: "High risk", count: highCount, dot: highCount > 0 },
  ]
  const [selected, setSelected] = useState<string[]>([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [deciding, setDeciding] = useState(false)

  const decide = useCallback(async (approvalId: string, decision: "approved" | "rejected", note?: string) => {
    setDeciding(true)
    try {
      const res = await fetch("/api/automations/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, approvalId, decision, note }),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!json.ok) throw new Error(json.error ?? "Failed to record decision.")
      toast(decision === "approved" ? "Approval recorded" : "Rejection recorded")
      reload()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Decision failed")
    } finally {
      setDeciding(false)
    }
  }, [workspaceId, toast, reload])

  // Bulk approve every selected low-risk approval through the real decision API.
  // High/critical risk items are intentionally excluded — they require a single,
  // deliberate approval each (the button is disabled unless all selected are low).
  const bulkApprove = useCallback(async () => {
    if (deciding || selected.length === 0) return
    setDeciding(true)
    try {
      const results = await Promise.all(
        selected.map((id) =>
          fetch("/api/automations/approvals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, approvalId: id, decision: "approved" }),
          })
            .then((r) => r.json())
            .then((j: { ok?: boolean }) => Boolean(j.ok))
            .catch(() => false),
        ),
      )
      const okCount = results.filter(Boolean).length
      toast(`Approved ${okCount} of ${selected.length} selected`)
      setSelected([])
      reload()
    } finally {
      setDeciding(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deciding, selected, workspaceId, toast, reload])

  const rows = useMemo(() => {
    if (tab === "high") return approvals.filter((a) => a.risk === "high" || a.risk === "critical")
    return approvals
  }, [approvals, tab])

  const columns: DataColumn<ApprovalRow>[] = useMemo(
    () => [
      {
        key: "automation", header: "Automation", render: (r) => (
          <div className="min-w-[180px]"><div className="font-medium text-slate-900">{r.automation}</div><div className="text-xs text-slate-400">{r.ref}</div></div>
        ),
      },
      { key: "action", header: "Proposed action", render: (r) => <span className="text-slate-600">{r.proposedAction}</span> },
      { key: "risk", header: "Risk level", render: (r) => <AutomationsRiskBadge level={r.risk} /> },
      { key: "related", header: "Related to", render: (r) => <span className="text-slate-600">{r.relatedTo} <span className="text-slate-400">{r.relatedRef}</span></span> },
      { key: "created", header: "Created", render: (r) => <span className="text-slate-500">{r.created}</span> },
      { key: "by", header: "Requested by", render: (r) => <span className="text-slate-500">{r.requestedBy}</span> },
      { key: "impact", header: "Impact", render: (r) => <span className="capitalize text-slate-600">{r.impact}</span> },
      { key: "deadline", header: "Review deadline", render: (r) => <span className={r.deadlineSoon ? "font-medium text-red-600" : "text-slate-500"}>{r.deadline}</span> },
      { key: "menu", header: "", render: () => <button className="text-slate-400">⋯</button> },
    ],
    [],
  )

  const lowRiskSelectedOnly = selected.length > 0 && selected.every((id) => approvals.find((a) => a.id === id)?.risk === "low")

  const actions = (
    <>
      <Btn icon={ChevronDown} variant="emerald" disabled={!lowRiskSelectedOnly || deciding} onClick={() => void bulkApprove()}>
        {deciding ? "Approving…" : `Bulk approve${lowRiskSelectedOnly ? ` (${selected.length})` : ""}`}
      </Btn>
      <Btn onClick={() => router.push("/property-manager/workspace-settings/automations")}>Rules policy</Btn>
      <Btn onClick={() => router.push("/property-manager/workspace-settings/automations")}>SLA settings</Btn>
    </>
  )

  return (
    <AutomationsModuleShell
      title="Approvals"
      subtitle="Review and approve automation decisions before they're executed."
      icon={ShieldCheck}
      actions={actions}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AutomationsKpiCard label="Pending approvals" value={approvals.length} icon={Clock} tone="amber" />
        <AutomationsKpiCard label="High-risk approvals" value={highCount} sub={highCount > 0 ? "Requires attention" : undefined} icon={ShieldCheck} tone="red" />
        <AutomationsKpiCard label="Approved today" value={0} icon={CheckCircle2} tone="emerald" />
        <AutomationsKpiCard label="Rejected today" value={0} icon={XCircle} tone="slate" />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`border-b-2 px-3.5 py-2.5 text-sm transition ${tab === t.id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent font-medium text-slate-500 hover:text-slate-800"}`}>
            {t.label} <span className="ml-1 text-slate-400">{t.count}</span>{t.dot && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <AutomationsDataTable
              columns={columns}
              rows={rows}
              selectable
              selectedIds={selected}
              onToggleRow={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
              onToggleAll={(c) => setSelected(c ? rows.map((r) => r.id) : [])}
              page={page}
              pageSize={8}
              total={rows.length}
              onPageChange={setPage}
              onRowClick={(r) => setActive(r)}
              activeRowId={active?.id}
            />
          )}
        </div>

        {/* Detail panel */}
        {active && (
          <Card>
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{active.automation}</h3><AutomationsRiskBadge level={active.risk} /></div>
            </div>
            <div className="space-y-4 p-4 text-sm">
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">Summary</div>
                <p className="mt-1 text-slate-600">{active.summary ?? `Proposes to ${active.proposedAction.toLowerCase()} for ${active.relatedTo} (${active.relatedRef}).`}</p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">Why this was proposed</div>
                <ul className="mt-1.5 space-y-1 text-slate-600">
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />Matches the {active.automation} rule conditions</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />Within review-first safety policy</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />Held for review before any side-effect is applied</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase text-slate-400">Request details</div>
                <dl className="mt-1.5 space-y-1 text-slate-600">
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Requested by</dt><dd>{active.requestedBy}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Created</dt><dd>{active.created}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-400">Review deadline</dt><dd className={active.deadlineSoon ? "font-medium text-red-600" : ""}>{active.deadline || "—"}</dd></div>
                </dl>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
              <Btn variant="outline" onClick={() => router.push("/property-manager/automations/runs-logs")}>Inspect run</Btn>
              <Btn variant="danger" icon={ThumbsDown} onClick={() => setRejectOpen(true)} disabled={deciding}>Reject</Btn>
              <Btn
                variant="emerald"
                className="flex-1 justify-center"
                disabled={deciding}
                onClick={() => void decide(active.id, "approved")}
              >
                {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Approve
              </Btn>
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectNote("") }}
        title="Reject approval"
        footer={
          <>
            <Btn variant="outline" onClick={() => { setRejectOpen(false); setRejectNote("") }}>Cancel</Btn>
            <Btn
              variant="danger"
              disabled={deciding || !rejectNote.trim()}
              onClick={async () => {
                if (!active) return
                await decide(active.id, "rejected", rejectNote)
                setRejectOpen(false)
                setRejectNote("")
              }}
            >
              {deciding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Reject
            </Btn>
          </>
        }
      >
        <label className="mb-1 block text-xs font-medium text-slate-600">Reason (required)</label>
        <textarea
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          className="h-24 w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-blue-400 focus:outline-none"
          placeholder="Why is this being rejected?"
        />
      </Modal>
    </AutomationsModuleShell>
  )
}
