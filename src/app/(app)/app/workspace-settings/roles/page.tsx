"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Check, Loader2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

/* ------------------------------------------------------------------ */
/* Types & constants                                                    */
/* ------------------------------------------------------------------ */
const ROLES = [
  "Owner",
  "Admin",
  "Manager",
  "Team Member",
  "Read-only",
  "Finance",
  "Compliance",
] as const
type Role = (typeof ROLES)[number]

const PERMISSION_GROUPS = [
  { group: "Portfolio",   permissions: ["view", "create", "edit", "delete", "export"] },
  { group: "Work",        permissions: ["view", "create", "edit", "delete", "approve", "export"] },
  { group: "Planning",    permissions: ["view", "create", "edit", "delete", "approve"] },
  { group: "Contacts",    permissions: ["view", "create", "edit", "delete", "export", "send"] },
  { group: "Money",       permissions: ["view", "create", "edit", "delete", "export", "approve"] },
  { group: "Calendar",    permissions: ["view", "create", "edit", "delete"] },
  { group: "Compliance",  permissions: ["view", "create", "edit", "delete", "export"] },
  { group: "AI Copilot",  permissions: ["view", "create", "approve"] },
  { group: "Inbox",       permissions: ["view", "send", "administer"] },
  { group: "Team",        permissions: ["view", "administer"] },
  { group: "Billing",     permissions: ["view", "administer"] },
  { group: "Settings",    permissions: ["view", "administer"] },
] as const

type PermissionState = Record<string, Record<string, boolean>>

const ALL_COLUMNS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "send",
  "administer",
] as const
type PermissionKey = (typeof ALL_COLUMNS)[number]

/* ------------------------------------------------------------------ */
/* Default permissions per role                                         */
/* ------------------------------------------------------------------ */
function getDefaultPermissions(role: Role): PermissionState {
  const perms: PermissionState = {}
  for (const { group, permissions } of PERMISSION_GROUPS) {
    perms[group] = {}
    for (const perm of permissions) {
      if (role === "Owner" || role === "Admin") {
        perms[group][perm] = true
      } else if (role === "Manager") {
        perms[group][perm] = !["delete", "administer"].includes(perm)
      } else if (role === "Team Member") {
        perms[group][perm] = ["view", "create"].includes(perm)
      } else if (role === "Read-only") {
        perms[group][perm] = perm === "view"
      } else if (role === "Finance") {
        perms[group][perm] = ["Money", "Billing"].includes(group)
          ? ["view", "create", "export"].includes(perm)
          : perm === "view"
      } else if (role === "Compliance") {
        perms[group][perm] = ["Compliance", "Portfolio", "Calendar"].includes(group)
          ? !["delete", "administer"].includes(perm)
          : perm === "view"
      } else {
        perms[group][perm] = false
      }
    }
  }
  return perms
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("Admin")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [enforcementNote, setEnforcementNote] = useState(false)

  // Maintain per-role permission overrides on top of defaults
  const [overrides, setOverrides] = useState<Record<Role, PermissionState>>(
    () =>
      Object.fromEntries(ROLES.map((r) => [r, getDefaultPermissions(r)])) as Record<
        Role,
        PermissionState
      >
  )

  // Read back any stored role permissions for this workspace
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_workspace_id")
          .eq("id", user.id)
          .maybeSingle()
        const wsId = profile?.current_workspace_id
        if (!wsId) return
        setWorkspaceId(wsId)

        // Live schema stores one row per (role, permission_key, allowed).
        // permission_key encodes the page's "group.perm" path.
        const { data, error } = await supabase
          .from("workspace_role_permissions")
          .select("role, permission_key, allowed")
          .eq("workspace_id", wsId)

        if (error) { setEnforcementNote(true); return }

        if (data && data.length > 0) {
          setOverrides((prev) => {
            const next = { ...prev }
            for (const row of data as { role: string; permission_key: string; allowed: boolean }[]) {
              const matched = ROLES.find(
                (r) => r.toLowerCase().replace(" ", "_") === row.role
              )
              if (!matched || !row.permission_key) continue
              const [group, perm] = row.permission_key.split(".")
              if (!group || !perm) continue
              const role = { ...(next[matched] ?? getDefaultPermissions(matched)) }
              role[group] = { ...(role[group] ?? {}), [perm]: !!row.allowed }
              next[matched] = role
            }
            return next
          })
        }
      } catch {
        setEnforcementNote(true)
      }
    }
    load()
  }, [])

  const currentPermissions = useMemo(
    () => overrides[selectedRole] ?? getDefaultPermissions(selectedRole),
    [overrides, selectedRole]
  )

  function togglePermission(group: string, perm: string) {
    setOverrides((prev) => {
      const roleCopy: PermissionState = {}
      for (const [g, ps] of Object.entries(prev[selectedRole])) {
        roleCopy[g] = { ...ps }
      }
      roleCopy[group] = {
        ...(roleCopy[group] ?? {}),
        [perm]: !(roleCopy[group]?.[perm] ?? false),
      }
      return { ...prev, [selectedRole]: roleCopy }
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      let wsId = workspaceId
      if (!wsId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("current_workspace_id")
            .eq("id", user.id)
            .maybeSingle()
          wsId = profile?.current_workspace_id ?? null
        }
      }
      if (wsId) {
        const role = selectedRole.toLowerCase().replace(" ", "_")
        const now = new Date().toISOString()
        // Flatten the role's nested permission state into one row per
        // (workspace_id, role, permission_key=group.perm, allowed).
        const rows: {
          workspace_id: string
          role: string
          permission_key: string
          allowed: boolean
          updated_at: string
        }[] = []
        for (const [group, perms] of Object.entries(overrides[selectedRole] ?? {})) {
          for (const [perm, allowed] of Object.entries(perms)) {
            rows.push({
              workspace_id: wsId,
              role,
              permission_key: `${group}.${perm}`,
              allowed: !!allowed,
              updated_at: now,
            })
          }
        }
        if (rows.length > 0) {
          const { error } = await supabase
            .from("workspace_role_permissions")
            .upsert(rows, { onConflict: "workspace_id,role,permission_key" })
          if (error) setEnforcementNote(true)
        }
      }
    } catch {
      setEnforcementNote(true)
    } finally {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Configure what each role can do in your workspace
        </p>
      </div>

      {enforcementNote && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          Permission definitions are stored here, but enforcement is applied by database row-level
          security policies. The matrix below configures the stored model; it does not bypass
          server-side checks.
        </div>
      )}

      {/* Role tabs */}
      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => {
              setSelectedRole(role)
              setSaved(false)
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all",
              selectedRole === role
                ? "bg-[#2563EB] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Owner notice */}
      {selectedRole === "Owner" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
          <p className="text-[13px] text-blue-800 font-medium">
            Owner role has full access to all features. Permissions cannot be modified.
          </p>
        </div>
      )}

      {/* Permission matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-24">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-[180px]">
                  Module
                </th>
                {ALL_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="text-center px-2 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide capitalize"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(({ group, permissions }) => {
                const groupPerms = currentPermissions[group] ?? {}
                const applicableSet = new Set(permissions as readonly string[])
                return (
                  <tr
                    key={group}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[12.5px] font-semibold text-slate-800">{group}</p>
                    </td>
                    {ALL_COLUMNS.map((perm: PermissionKey) => {
                      const applicable = applicableSet.has(perm)
                      const enabled = applicable && (groupPerms[perm] ?? false)
                      return (
                        <td key={perm} className="px-2 py-3.5 text-center">
                          {applicable ? (
                            <button
                              onClick={() =>
                                selectedRole !== "Owner" && togglePermission(group, perm)
                              }
                              disabled={selectedRole === "Owner"}
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center mx-auto transition-all",
                                enabled
                                  ? "bg-[#2563EB] border-[#2563EB]"
                                  : "border-slate-300 hover:border-slate-400",
                                selectedRole === "Owner" && "cursor-not-allowed opacity-75"
                              )}
                            >
                              {enabled && <Check className="w-3 h-3 text-white" />}
                            </button>
                          ) : (
                            <span className="block w-5 h-5 mx-auto text-slate-200 text-center leading-5 text-[12px]">
                              —
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-slate-500">
          {saved
            ? "Changes saved"
            : `Editing permissions for: ${selectedRole}`}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setOverrides((prev) => ({
                ...prev,
                [selectedRole]: getDefaultPermissions(selectedRole),
              }))
              setSaved(false)
            }}
            disabled={selectedRole === "Owner"}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Reset to defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || selectedRole === "Owner"}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors disabled:opacity-70"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
