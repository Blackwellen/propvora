"use client"

import React from "react"
import { ToggleRow } from "./shared"

export interface MFAPolicySectionProps {
  requireMfaAdmins: boolean
  requireMfaAll: boolean
  onToggle: (field: "requireMfaAdmins" | "requireMfaAll") => void
}

export function MFAPolicySection({ requireMfaAdmins, requireMfaAll, onToggle }: MFAPolicySectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">MFA Policy</h3>
      <p className="text-[12px] text-slate-400 mb-4">
        Enforce multi-factor authentication for workspace members
      </p>
      <ToggleRow
        label="Require MFA for admins"
        description="Admins and owners must set up MFA before accessing the workspace"
        checked={requireMfaAdmins}
        onChange={() => onToggle("requireMfaAdmins")}
      />
      <ToggleRow
        label="Require MFA for all users"
        description="All team members must set up MFA before accessing the workspace"
        checked={requireMfaAll}
        onChange={() => onToggle("requireMfaAll")}
      />
    </div>
  )
}
