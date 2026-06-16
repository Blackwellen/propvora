"use client"

import React, { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Building2, Activity, ChevronRight, Shield, Pencil, Check, X, Ban, RotateCcw,
  AlertTriangle, KeyRound, ShieldCheck, ShieldAlert, Mail, Clock,
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { NativeSelect } from "@/components/admin-wizard/AdminWizard"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { suspendUser, reactivateUser } from "@/app/(admin)/admin/actions"
import { updateUser, setUserPlatformRole, sendUserPasswordReset } from "@/lib/admin/mutations"
import type { AdminUserDetail } from "@/lib/admin/data"

function roleBadge(role: string) {
  if (role === "platform_admin" || role === "admin") return <Badge variant="ai">Platform admin</Badge>
  if (role === "support") return <Badge variant="primary">Support</Badge>
  return <Badge variant="default">User</Badge>
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"
}

function Banner({ kind, msg }: { kind: "ok" | "err"; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[12px] ${kind === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
      {kind === "err" && <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
      <span>{msg}</span>
    </div>
  )
}

export default function UserDetailClient({ user }: { user: AdminUserDetail }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  // Inline profile edit
  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const [phone, setPhone] = useState(user.phone ?? "")
  const [savingProfile, setSavingProfile] = useState(false)

  // Role
  const [role, setRole] = useState(
    user.role === "platform_admin" || user.role === "admin" ? "admin" : user.role === "support" ? "support" : "",
  )
  const [savingRole, setSavingRole] = useState(false)

  async function saveProfile() {
    setSavingProfile(true); setMsg(null)
    const res = await updateUser(user.id, { firstName, lastName, phone })
    setSavingProfile(false)
    if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return }
    setMsg({ kind: "ok", msg: "Profile updated." })
    setEditing(false)
    startTransition(() => router.refresh())
  }

  async function saveRole(next: string) {
    setSavingRole(true); setMsg(null)
    const res = await setUserPlatformRole(user.id, next as "" | "support" | "admin")
    setSavingRole(false)
    if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); setRole(role); return }
    setRole(next)
    setMsg({ kind: "ok", msg: "Role updated." })
    startTransition(() => router.refresh())
  }

  async function resetPassword() {
    setMsg(null)
    if (!user.email) { setMsg({ kind: "err", msg: "No email on file." }); return }
    const res = await sendUserPasswordReset(user.id, user.email)
    setMsg(res.ok ? { kind: "ok", msg: "Password-reset link generated." } : { kind: "err", msg: res.error ?? "Failed" })
  }

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    return async () => {
      setMsg(null)
      const res = await fn()
      if (!res.ok) { setMsg({ kind: "err", msg: res.error ?? "Failed" }); return }
      setMsg({ kind: "ok", msg: ok })
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className="flex-1 min-w-0 space-y-4">
        {msg && <Banner kind={msg.kind} msg={msg.msg} />}

        {/* Header */}
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center shrink-0">
              {(user.name || user.email || "?").split(/[\s@.]+/).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">{user.name ?? "—"}</h1>
                {roleBadge(role === "admin" ? "admin" : role || user.role)}
                {user.security.banned && <Badge variant="danger" dot>Suspended</Badge>}
              </div>
              <p className="text-sm text-slate-500">{user.email ?? "No email on file"}</p>
              <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                <span>Joined {fmtDate(user.createdAt)}</span>
                {user.phone ? <><span>•</span><span>{user.phone}</span></> : null}
                <span>•</span><span>{user.memberships.length} workspace{user.memberships.length === 1 ? "" : "s"}</span>
                <span>•</span><span className="font-mono">{user.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList variant="underline">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Overview — inline editable profile */}
          <TabsContent value="overview">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:underline">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={savingProfile} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => { setEditing(false); setFirstName(user.firstName ?? ""); setLastName(user.lastName ?? ""); setPhone(user.phone ?? "") }} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline">
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {editing ? (
                  <div className="grid sm:grid-cols-2 gap-3 max-w-lg">
                    <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} wrapperClassName="sm:col-span-2" />
                  </div>
                ) : (
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm max-w-lg">
                    {[
                      ["First name", user.firstName ?? "—"],
                      ["Last name", user.lastName ?? "—"],
                      ["Email", user.email ?? "—"],
                      ["Phone", user.phone ?? "—"],
                      ["Country", user.country ?? "—"],
                      ["User ID", user.id.slice(0, 13) + "…"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
                        <dd className="text-slate-800 font-medium mt-0.5 truncate">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Workspaces */}
          <TabsContent value="workspaces">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-slate-900">Workspace Memberships</h3>
              </div>
              {user.memberships.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400">Not a member of any workspace</div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {user.memberships.map((m) => (
                    <div key={m.workspaceId} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#0D1B2A] flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{m.workspaceName}</p>
                          <div className="flex gap-2 mt-0.5 items-center">
                            <Badge variant="outline" size="sm">{m.role}</Badge>
                            <span className="text-[10px] text-slate-400">Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-GB") : "—"}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/admin/workspaces/${m.workspaceId}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:underline shrink-0">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-slate-900">Recent Activity (Audit)</h3>
              </div>
              <div className="p-4">
                {user.recentAudit.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">No audit events recorded for this user.</p>
                ) : (
                  <div className="space-y-2.5">
                    {user.recentAudit.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-slate-50 last:border-0">
                        <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                          <Activity className="w-3 h-3 text-[#2563EB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-medium text-slate-700">{e.action}</p>
                          <p className="text-[11px] text-slate-400">{e.workspaceName ?? ""}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                          {e.createdAt ? new Date(e.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card noPadding>
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-slate-900">Account Security</h3>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {[
                  { icon: Mail, label: "Email confirmed", val: user.security.emailConfirmed ? <Badge variant="success" size="sm">Confirmed</Badge> : <Badge variant="warning" size="sm">Pending</Badge> },
                  { icon: Clock, label: "Last sign-in", val: <span className="text-xs text-slate-600">{user.security.lastSignInAt ? new Date(user.security.lastSignInAt).toLocaleString("en-GB") : "Never"}</span> },
                  { icon: user.security.banned ? ShieldAlert : ShieldCheck, label: "Account status", val: user.security.banned ? <Badge variant="danger" size="sm">Suspended</Badge> : <Badge variant="success" size="sm">Active</Badge> },
                  { icon: KeyRound, label: "Two-factor (MFA)", val: user.security.mfaEnrolled ? <Badge variant="success" size="sm">Enrolled</Badge> : <Badge variant="default" size="sm">Not set up</Badge> },
                  { icon: Shield, label: "Sign-in provider", val: <span className="text-xs text-slate-600 capitalize">{user.security.provider ?? "email"}</span> },
                ].map((r) => {
                  const I = r.icon
                  return (
                    <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-2.5 text-sm text-slate-700"><I className="w-4 h-4 text-slate-400" /> {r.label}</div>
                      {r.val}
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right rail */}
      <div className="w-full lg:w-60 shrink-0 space-y-4">
        {/* Role assignment */}
        <Card className="p-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Platform Role</h3>
          <NativeSelect
            value={role}
            onChange={(v) => saveRole(v)}
            options={[{ value: "", label: "Standard user" }, { value: "support", label: "Support staff" }, { value: "admin", label: "Platform admin" }]}
          />
          <p className="text-[10px] text-slate-400 mt-2">{savingRole ? "Saving…" : "Changes are immediate and audited. Admins gain full console access."}</p>
        </Card>

        {/* Admin actions */}
        <Card className="p-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Admin Actions</h3>
          <div className="space-y-2">
            <button onClick={resetPassword} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-700 hover:bg-slate-50">
              <KeyRound className="w-3.5 h-3.5" /> Send password reset
            </button>
            {user.security.banned ? (
              <ConfirmDialog
                title={`Reactivate ${user.name ?? "user"}?`}
                description="This lifts the suspension and restores sign-in access."
                confirmLabel="Reactivate"
                confirmVariant="primary"
                onConfirm={runAction(() => reactivateUser(user.id), "User reactivated.")}
              >
                {(open) => (
                  <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                    <RotateCcw className="w-3.5 h-3.5" /> Reactivate account
                  </button>
                )}
              </ConfirmDialog>
            ) : (
              <ConfirmDialog
                title={`Suspend ${user.name ?? "user"}?`}
                description="This blocks the user from signing in across all their workspaces. No data is deleted and it can be reversed."
                confirmLabel="Suspend account"
                confirmVariant="danger"
                onConfirm={runAction(() => suspendUser(user.id), "User suspended.")}
              >
                {(open) => (
                  <button onClick={open} className="w-full inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                    <Ban className="w-3.5 h-3.5" /> Suspend account
                  </button>
                )}
              </ConfirmDialog>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-3">Suspension is enforced at the auth layer and written to the audit log.</p>
        </Card>
      </div>
    </div>
  )
}
