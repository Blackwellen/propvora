"use client"

import React from "react"

export interface TeamMember {
  id: string
  fullName: string
  email: string
  role: string
  avatarInitials?: string
  joinedAt?: string | null
}

export interface TeamMembersTableProps {
  members: TeamMember[]
  search: string
  roleFilter: string
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: string) => void
  onChangeRole: (memberId: string, newRole: string) => void
  onRemove: (memberId: string) => void
}

const ROLES = ["all", "owner", "admin", "manager", "member", "read_only", "finance", "compliance"]

function roleBadgeClass(role: string): string {
  switch (role) {
    case "owner": return "bg-violet-100 text-violet-700"
    case "admin": return "bg-[var(--color-brand-100)] text-[var(--brand)]"
    case "manager": return "bg-emerald-100 text-emerald-700"
    case "finance": return "bg-amber-100 text-amber-700"
    case "compliance": return "bg-orange-100 text-orange-700"
    case "read_only": return "bg-slate-100 text-slate-600"
    default: return "bg-slate-100 text-slate-600"
  }
}

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TeamMembersTable({
  members,
  search,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onChangeRole,
  onRemove,
}: TeamMembersTableProps) {
  const filtered = members.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || m.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search members…"
          className="flex-1 min-w-[160px] h-9 px-3 rounded-lg text-sm border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)] transition-all bg-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="h-9 px-3 rounded-lg text-sm border border-slate-200 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 transition-all"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{r === "all" ? "All roles" : roleLabel(r)}</option>
          ))}
        </select>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 pt-3 px-5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Member</th>
              <th className="pb-3 pt-3 px-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="pb-3 pt-3 px-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
              <th className="pb-3 pt-3 px-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-slate-400">No members found</td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-[var(--brand)] text-[11px] font-bold shrink-0">
                        {m.avatarInitials ?? m.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">{m.fullName}</p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={m.role}
                      onChange={(e) => onChangeRole(m.id, e.target.value)}
                      className="text-[12px] border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--brand)]/20"
                    >
                      {ROLES.filter((r) => r !== "all").map((r) => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-[12px] text-slate-400">
                    {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("en-GB") : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onRemove(m.id)}
                      className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No members found</p>
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center text-[var(--brand)] text-xs font-bold shrink-0">
                  {m.avatarInitials ?? m.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{m.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                  <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleBadgeClass(m.role)}`}>
                    {roleLabel(m.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                className="text-[12px] text-red-500 hover:text-red-700 font-medium transition-colors shrink-0"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
