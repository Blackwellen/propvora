"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Search, UserPlus, Trash2, RefreshCw, X, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { changeMemberRole, removeMember } from "@/lib/actions/settings"
import { ConfirmDialog } from "@/components/portfolio/ConfirmDialog"
import { PLAN_DISPLAY, normaliseTier } from "@/lib/billing/plans"
import { ResponsiveTable } from "@/components/mobile"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "invited"
  mfa: boolean
  aiUsage: number
  lastActive: string
  avatar: string
  avatarColour: string
}

const AVATAR_COLOURS = ["#2563EB", "#059669", "#D97706", "#7C3AED", "#DC2626", "#0891B2"]

function initials(name: string) {
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2)
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Admin")
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const ROLE_OPTIONS = ["owner", "admin", "manager", "member", "read_only"]

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()

        const wsId = profile?.current_workspace_id
        if (!wsId) { setLoading(false); return }
        setWorkspaceId(wsId)

        const { data, error } = await supabase
          .from("workspace_members")
          .select("id, role, joined_at:created_at, profiles(id, full_name:display_name, avatar_url)")
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: true })

        if (error) { setLoadError("Failed to load team members."); setLoading(false); return }

        const list: TeamMember[] = (data ?? []).map((row, i) => {
          const profile = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) as unknown as { id: string; full_name: string | null; email?: string | null } | null
          const name = profile?.full_name ?? profile?.email ?? "Unknown"
          return {
            id: row.id as string,
            name,
            email: profile?.email ?? "",
            role: (row.role as string) || "Member",
            status: row.joined_at ? "active" : "invited",
            mfa: false,
            aiUsage: 0,
            lastActive: row.joined_at
              ? new Date(row.joined_at as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
              : "Never",
            avatar: initials(name),
            avatarColour: AVATAR_COLOURS[i % AVATAR_COLOURS.length],
          }
        })
        setMembers(list)
      } catch {
        setLoadError("Could not load team.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredTeam = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      const matchRole =
        roleFilter === "all" || m.role.toLowerCase().replace(" ", "") === roleFilter
      return matchSearch && matchRole
    })
  }, [members, search, roleFilter])

  async function handleRemove(id: string) {
    setActionError(null)
    setBusyId(id)
    const res = await removeMember(id)
    setBusyId(null)
    if (!res.ok) { setActionError(res.error ?? "Could not remove member."); return }
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleRoleChange(id: string, newRole: string) {
    setActionError(null)
    setBusyId(id)
    const res = await changeMemberRole(id, newRole)
    setBusyId(null)
    if (!res.ok) { setActionError(res.error ?? "Could not change role."); return }
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)))
  }

  async function handleSendInvite() {
    if (!inviteEmail.trim() || !workspaceId) return
    setInviting(true)
    setInviteMsg(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch workspace name for the invite email
      const { data: wsData } = await supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .maybeSingle()
      const workspaceName: string = wsData?.name ?? "your workspace"

      // ── Seat gate: block if the plan's seat limit is reached ──────────────
      try {
        const { data: wsPlan } = await supabase
          .from("workspaces").select("plan").eq("id", workspaceId).maybeSingle()
        const tier = normaliseTier((wsPlan as { plan?: string } | null)?.plan)
        const seatLimit = PLAN_DISPLAY[tier].features.teamSeats
        if (typeof seatLimit === "number") {
          const { count: memberCount } = await supabase
            .from("workspace_members").select("id", { head: true, count: "exact" }).eq("workspace_id", workspaceId)
          const { count: pendingCount } = await supabase
            .from("workspace_invitations").select("id", { head: true, count: "exact" })
            .eq("workspace_id", workspaceId).eq("status", "pending")
          if ((memberCount ?? 0) + (pendingCount ?? 0) >= seatLimit) {
            setInviteMsg(`Your ${PLAN_DISPLAY[tier].name} plan includes ${seatLimit} seats. Upgrade to invite more team members.`)
            return
          }
        }
      } catch { /* if the check fails, fall through and let the insert proceed */ }

      // Save invitation record and capture the inserted row's id
      const { data: insertedInvite, error: insertError } = await supabase
        .from("workspace_invitations")
        .insert({
          workspace_id: workspaceId,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole.toLowerCase().replace(" ", "_"),
          invited_by: user?.id ?? null,
          status: "pending",
          token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id")
        .maybeSingle()

      if (insertError) {
        setInviteMsg("Could not save invite. Please try again.")
        return
      }

      const invitationId: string = (insertedInvite as { id: string } | null)?.id ?? `inv_${Date.now()}`

      // Fire the invite email via the server-side API route
      try {
        await fetch("/api/email/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inviteeEmail: inviteEmail.trim().toLowerCase(),
            inviteeName: "",
            workspaceName,
            invitationId,
          }),
        })
      } catch {
        // Email failure is non-fatal — the invite record is saved
        console.warn("[team] Invite email send failed (non-critical)")
      }

      setInviteMsg("Invite sent successfully.")

      // Optimistically add to list
      setMembers((prev) => [
        ...prev,
        {
          id: invitationId,
          name: inviteEmail.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          status: "invited",
          mfa: false,
          aiUsage: 0,
          lastActive: "Never",
          avatar: inviteEmail[0].toUpperCase(),
          avatarColour: "#94A3B8",
        },
      ])
    } catch {
      setInviteMsg("Something went wrong. Please try again.")
    } finally {
      setInviting(false)
      setTimeout(() => {
        setShowInviteModal(false)
        setInviteEmail("")
        setInviteRole("Admin")
        setInviteMsg(null)
      }, 2000)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900">Team</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage team members and access</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite user
        </button>
      </div>

      {loadError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {loadError}
        </div>
      )}

      {actionError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            aria-label="Search team"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 focus:outline-none focus:border-[#2563EB] transition-all"
          />
        </div>
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-700 bg-white focus:outline-none focus:border-[#2563EB] transition-all"
        >
          <option value="all">All roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="teammember">Member</option>
        </select>
      </div>

      {/* Team table (desktop) / card list (mobile) */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
      <ResponsiveTable
        rows={filteredTeam}
        mobile={{
          getKey: (m) => m.id,
          title: (m) => m.name,
          subtitle: (m) => m.email || undefined,
          leading: (m) => (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0"
              style={{ backgroundColor: m.avatarColour }}
            >
              {m.avatar}
            </div>
          ),
          badge: (m) => (
            <span
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                m.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {m.status === "active" ? "Active" : "Invited"}
            </span>
          ),
          fields: [
            {
              label: "Role",
              render: (m) =>
                m.status === "invited" ? (
                  <span className="capitalize">{m.role}</span>
                ) : (
                  <select
                    aria-label={`Change role for ${m.name ?? "member"}`}
                    value={m.role.toLowerCase()}
                    disabled={busyId === m.id}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="w-full text-[13px] font-medium text-slate-700 px-2.5 py-2 rounded-lg bg-slate-100 capitalize focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-50 min-h-[40px]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                ),
            },
            { label: "MFA", render: (m) => (m.mfa ? "Enabled" : "Off") },
            { label: "AI Usage", render: (m) => `${m.aiUsage} credits` },
            { label: "Last Active", render: (m) => m.lastActive },
          ],
          actions: (m) => (
            <div className="flex items-center gap-2">
              {busyId === m.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <>
                  {m.role.toLowerCase() !== "owner" && (
                    <ConfirmDialog
                      title="Remove team member?"
                      description={`${m.name} will lose access to this workspace immediately.`}
                      confirmLabel="Remove"
                      onConfirm={() => handleRemove(m.id)}
                    >
                      {(open) => (
                        <button
                          onClick={open}
                          className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </ConfirmDialog>
                  )}
                  {m.status === "invited" && (
                    <button className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-[13px] font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                      Resend
                    </button>
                  )}
                </>
              )}
            </div>
          ),
        }}
        emptyState={
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-10 text-center text-[13px] text-slate-400">
            {members.length === 0 ? "No team members found." : "No team members match your search."}
          </div>
        }
      >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["User", "Role", "Status", "MFA", "AI Usage", "Last Active", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-slate-400">
                    {members.length === 0 ? "No team members found." : "No team members match your search."}
                  </td>
                </tr>
              )}
              {filteredTeam.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                        style={{ backgroundColor: member.avatarColour }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{member.name}</p>
                        <p className="text-[11px] text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Role — inline editable (non-owner; owner role guarded server-side) */}
                  <td className="px-5 py-4">
                    {member.status === "invited" ? (
                      <span className="text-[12px] font-medium text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100 capitalize">
                        {member.role}
                      </span>
                    ) : (
                      <select
                        aria-label={`Change role for ${member.name ?? "member"}`}
                        value={member.role.toLowerCase()}
                        disabled={busyId === member.id}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-[12px] font-medium text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100 capitalize focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2.5 py-1 rounded-full",
                        member.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {member.status === "active" ? "Active" : "Invited"}
                    </span>
                  </td>
                  {/* MFA */}
                  <td className="px-5 py-4">
                    {member.mfa ? (
                      <span className="text-emerald-600 text-[11px] font-semibold">Enabled</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Off</span>
                    )}
                  </td>
                  {/* AI Usage */}
                  <td className="px-5 py-4">
                    <p className="text-[12.5px] text-slate-700">{member.aiUsage} credits</p>
                  </td>
                  {/* Last Active */}
                  <td className="px-5 py-4">
                    <p className="text-[12.5px] text-slate-500">{member.lastActive}</p>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {busyId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {member.role.toLowerCase() !== "owner" && (
                            <ConfirmDialog
                              title="Remove team member?"
                              description={`${member.name} will lose access to this workspace immediately.`}
                              confirmLabel="Remove"
                              onConfirm={() => handleRemove(member.id)}
                            >
                              {(open) => (
                                <button
                                  onClick={open}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </ConfirmDialog>
                          )}
                          {member.status === "invited" && (
                            <button
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title="Resend invite"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
      </ResponsiveTable>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-[480px] mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-slate-900">Invite team member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="invite-email" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="invite-email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-[#2563EB] transition-all"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] bg-white focus:outline-none focus:border-[#2563EB] transition-all"
                >
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Team Member</option>
                  <option>Read-only</option>
                </select>
              </div>
              {inviteMsg && (
                <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {inviteMsg}
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
              >
                {inviting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {inviting ? "Sending…" : "Send invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
