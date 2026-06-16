"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2, Activity, ExternalLink, Pencil, Check, X, AlertTriangle,
  Ban, RotateCcw, Archive, Trash2, Database,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { NativeSelect } from "@/components/admin-wizard/AdminWizard"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { suspendWorkspace, restoreWorkspace, archiveWorkspace } from "@/app/(admin)/admin/actions"
import { updateWorkspace, setMemberRole, removeMember } from "@/lib/admin/mutations"
import type { AdminWorkspaceDetail } from "@/lib/admin/data"

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" }, { value: "operator", label: "Operator" },
  { value: "scale", label: "Scale" }, { value: "pro_agency", label: "Pro Agency" }, { value: "enterprise", label: "Enterprise" },
]
const STATUS_OPTIONS = [
  { value: "active", label: "Active" }, { value: "trialing", label: "Trialing" },
  { value: "suspended", label: "Suspended" }, { value: "past_due", label: "Past due" }, { value: "canceled", label: "Archived" },
]
const MEMBER_ROLES = ["owner", "admin", "manager", "member", "accountant"]

function planBadge(plan: string) {
  if (plan === "enterprise") return <Badge variant="ai">Enterprise</Badge>
  if (plan === "scale" || plan === "pro_agency") return <Badge variant="primary">{plan === "pro_agency" ? "Pro Agency" : "Scale"}</Badge>
  if (plan === "operator") return <Badge variant="primary">Operator</Badge>
  return <Badge variant="default">{plan}</Badge>
}
function statusBadge(status: string) {
  if (status === "active") return <Badge variant="success" dot>Active</Badge>
  if (status === "trialing") return <Badge variant="warning" dot>Trialing</Badge>
  if (status === "suspended") return <Badge variant="danger" dot>Suspended</Badge>
  if (status === "past_due") return <Badge variant="danger" dot>Past due</Badge>
  if (status === "canceled") return <Badge variant="default" dot>Archived</Badge>
  return <Badge dot>{status}</Badge>
}
function Banner({ kind, msg }: { kind: "ok" | "err"; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[12px] ${kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {kind === "err" && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}<span>{msg}</span>
    </div>
  )
}

export default function WorkspaceDetailClient({ ws }: { ws: AdminWorkspaceDetail }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(ws.name)
  const [plan, setPlan] = useState(ws.plan)
  const [status, setStatus] = useState(ws.planStatus)
  const [saving, setSaving] = useState(false)

  const isSuspended = ws.planStatus === "suspended"
  const isArchived = ws.planStatus === "canceled"

  async function saveEdit() {
    setSaving(true); setMsg(null)
    const res = await updateWorkspace(ws.id, { name, plan: plan as never, planStatus: status })
    setSaving(false)
    if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return }
    setMsg({ kind: "ok", msg: "Workspace updated." }); setEditing(false)
    startTransition(() => router.refresh())
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    return async () => {
      setMsg(null)
      const res = await fn()
      if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return }
      setMsg({ kind: "ok", msg: ok })
      startTransition(() => router.refresh())
    }
  }

  async function changeMemberRole(userId: string, role: string) {
    setMsg(null)
    const res = await setMemberRole(ws.id, userId, role as never)
    if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return }
    setMsg({ kind: "ok", msg: "Member role updated." })
    startTransition(() => router.refresh())
  }

  const dataEntries = Object.entries(ws.dataSummary)

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 min-w-0 space-y-4">
        {msg && <Banner kind={msg.kind} msg={msg.msg} />}

        {/* Header */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0D1B2A] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-lg font-bold text-slate-900">{ws.name}</h1>
                {planBadge(ws.plan)}{statusBadge(ws.planStatus)}
              </div>
              <p className="text-sm text-slate-500">Owner: {ws.owner.name ?? "—"}{ws.owner.email ? ` · ${ws.owner.email}` : ""}</p>
              <p className="text-xs text-slate-400">
                Created {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                {" · "}<span className="font-mono">{ws.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList variant="underline">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          {/* Overview — inline editable plan/status/name */}
          <TabsContent value="overview">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Workspace Settings</h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Save</button>
                    <button onClick={() => { setEditing(false); setName(ws.name); setPlan(ws.plan); setStatus(ws.planStatus) }} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline"><X className="w-3.5 h-3.5" /> Cancel</button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {editing ? (
                  <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
                    <div className="sm:col-span-2"><Input label="Name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1.5">Plan</span><NativeSelect value={plan} onChange={setPlan} options={PLAN_OPTIONS} /></label>
                    <label className="block"><span className="block text-sm font-medium text-slate-700 mb-1.5">Status</span><NativeSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} /></label>
                  </div>
                ) : (
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
                    {[
                      ["Plan", PLAN_OPTIONS.find((p) => p.value === ws.plan)?.label ?? ws.plan],
                      ["Status", STATUS_OPTIONS.find((s) => s.value === ws.planStatus)?.label ?? ws.planStatus],
                      ["Members", String(ws.members.length)],
                      ["Stripe customer", ws.stripeCustomerId ?? "Not linked"],
                      ["Demo data", ws.demoDataLoaded ? "Loaded" : "None"],
                      ["Workspace ID", ws.id.slice(0, 13) + "…"],
                    ].map(([k, v]) => (
                      <div key={k}><dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt><dd className="text-slate-800 font-medium mt-0.5 truncate">{v}</dd></div>
                    ))}
                  </dl>
                )}
              </div>
            </Card>

            <Card noPadding className="mt-4">
              <div className="px-4 py-3 border-b border-[#E2E8F0]"><h3 className="text-sm font-semibold text-slate-900">Data Summary</h3></div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dataEntries.map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl border border-[#E2E8F0] bg-white">
                    <p className="text-xl font-bold text-[#2563EB]">{v === null ? "—" : v.toLocaleString("en-GB")}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{k}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Members — role change + remove */}
          <TabsContent value="members">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Members</h3><span className="text-xs text-slate-400">{ws.members.length}</span>
              </div>
              {ws.members.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">No members</div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {ws.members.map((m) => {
                    const isOwner = m.userId === ws.owner.id
                    return (
                      <div key={m.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <Link href={`/admin/users/${m.userId}`} className="min-w-0 group">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-[#2563EB] truncate">{m.name ?? m.email ?? "Unknown"}</p>
                          <p className="text-[11px] text-slate-400 truncate">{m.email ?? ""}</p>
                        </Link>
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={m.role}
                            disabled={isOwner}
                            onChange={(e) => changeMemberRole(m.userId, e.target.value)}
                            className="h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-60"
                          >
                            {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          {!isOwner && (
                            <ConfirmDialog
                              title={`Remove ${m.name ?? "member"}?`}
                              description="They lose access to this workspace. This does not delete their account."
                              confirmLabel="Remove member"
                              confirmVariant="danger"
                              onConfirm={run(() => removeMember(ws.id, m.userId), "Member removed.")}
                            >
                              {(open) => (
                                <button onClick={open} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center" title="Remove member">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </ConfirmDialog>
                          )}
                          {isOwner && <Badge variant="outline" size="sm">Owner</Badge>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]"><h3 className="text-sm font-semibold text-slate-900">Billing</h3></div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Plan</span>{planBadge(ws.plan)}</div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Status</span>{statusBadge(ws.planStatus)}</div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stripe customer</span>
                  {ws.stripeCustomerId ? (
                    <a href={`https://dashboard.stripe.com/customers/${ws.stripeCustomerId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> View in Stripe
                    </a>
                  ) : <span className="text-xs text-slate-400">Not linked</span>}
                </div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-50">Invoices and live subscription data appear once a Stripe subscription is created for this workspace.</p>
              </div>
            </Card>
          </TabsContent>

          {/* Usage */}
          <TabsContent value="usage">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]"><h3 className="text-sm font-semibold text-slate-900">Resource Usage</h3></div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dataEntries.map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl border border-[#E2E8F0] flex items-center gap-3">
                    <Database className="w-4 h-4 text-slate-300 shrink-0" />
                    <div><p className="text-base font-bold text-slate-800">{v === null ? "—" : v.toLocaleString("en-GB")}</p><p className="text-[11px] text-slate-500 capitalize">{k}</p></div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]"><h3 className="text-sm font-semibold text-slate-900">Recent Activity (Audit)</h3></div>
              <div className="p-4">
                {ws.recentAudit.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No audit events recorded for this workspace.</p>
                ) : (
                  <div className="space-y-2.5">
                    {ws.recentAudit.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0"><Activity className="w-3 h-3 text-[#2563EB]" /></div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-mono font-medium text-slate-700">{e.action}</p><p className="text-[11px] text-slate-400">{e.actorName ?? e.actorEmail ?? "system"}</p></div>
                        <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right rail */}
      <div className="w-full lg:w-60 shrink-0 space-y-4">
        <Card className="p-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Lifecycle</h3>
          <div className="space-y-2">
            {isSuspended ? (
              <ConfirmDialog title="Restore this workspace?" description={`Members of "${ws.name}" regain access immediately.`} confirmLabel="Restore" confirmVariant="primary" onConfirm={run(() => restoreWorkspace(ws.id), "Workspace restored.")}>
                {(open) => <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><RotateCcw className="w-3.5 h-3.5" /> Restore workspace</button>}
              </ConfirmDialog>
            ) : (
              <ConfirmDialog title="Suspend this workspace?" description={`All members of "${ws.name}" lose access until restored. No data is deleted.`} confirmLabel="Suspend" confirmVariant="danger" onConfirm={run(() => suspendWorkspace(ws.id), "Workspace suspended.")}>
                {(open) => <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100"><Ban className="w-3.5 h-3.5" /> Suspend workspace</button>}
              </ConfirmDialog>
            )}
            {isArchived ? (
              <ConfirmDialog title="Restore archived workspace?" description={`"${ws.name}" will be reactivated.`} confirmLabel="Restore" confirmVariant="primary" onConfirm={run(() => restoreWorkspace(ws.id), "Workspace restored.")}>
                {(open) => <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-700 hover:bg-slate-50"><RotateCcw className="w-3.5 h-3.5" /> Restore from archive</button>}
              </ConfirmDialog>
            ) : (
              <ConfirmDialog title="Archive this workspace?" description={`"${ws.name}" is marked cancelled and hidden from active use. Reversible — no data deleted.`} confirmLabel="Archive" confirmVariant="danger" onConfirm={run(() => archiveWorkspace(ws.id), "Workspace archived.")}>
                {(open) => <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100"><Archive className="w-3.5 h-3.5" /> Archive workspace</button>}
              </ConfirmDialog>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-3">Every action is permission-checked and audited.</p>
        </Card>
      </div>
    </div>
  )
}
