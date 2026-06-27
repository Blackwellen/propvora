"use client"

import React from "react"
import { CheckSquare, Square } from "lucide-react"

export type PermissionKey = "view" | "create" | "edit" | "delete" | "approve" | "export" | "send" | "administer"

export interface PermissionRow {
  role: string
  permissions: Partial<Record<PermissionKey, boolean>>
}

export interface PermissionGroup {
  group: string
  rows: PermissionRow[]
}

export interface PermissionMatrixProps {
  columns: PermissionKey[]
  roles: string[]
  matrix: Record<string, Record<string, Partial<Record<PermissionKey, boolean>>>>
  onToggle: (group: string, role: string, permission: PermissionKey) => void
}

const COL_LABELS: Record<PermissionKey, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
  export: "Export",
  send: "Send",
  administer: "Admin",
}

export function PermissionMatrix({ columns, roles, matrix, onToggle }: PermissionMatrixProps) {
  const groups = Object.keys(matrix)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: `${200 + columns.length * 80}px` }}>
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-3 pt-2 pr-4 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-40">
              Group / Role
            </th>
            {columns.map((col) => (
              <th key={col} className="pb-3 pt-2 px-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {COL_LABELS[col]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <React.Fragment key={group}>
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="pt-4 pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50/60 px-2 rounded"
                >
                  {group}
                </td>
              </tr>
              {roles.map((role) => {
                const perms = matrix[group]?.[role] ?? {}
                return (
                  <tr key={role} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="py-2.5 pr-4 text-[12.5px] font-medium text-slate-700 pl-2">{role}</td>
                    {columns.map((col) => {
                      const checked = !!perms[col]
                      return (
                        <td key={col} className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onToggle(group, role, col)}
                            className="transition-colors"
                            aria-label={`${checked ? "Revoke" : "Grant"} ${col} for ${role} in ${group}`}
                          >
                            {checked ? (
                              <CheckSquare className="w-4 h-4 text-[var(--brand)] mx-auto" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 mx-auto" />
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
