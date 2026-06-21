"use client"

import React from "react"
import { ToggleRow } from "./shared"

export interface AccessControlSectionProps {
  dataExportRestricted: boolean
  roleChangeApproval: boolean
  onToggle: (field: "dataExportRestricted" | "roleChangeApproval") => void
}

export function AccessControlSection({
  dataExportRestricted,
  roleChangeApproval,
  onToggle,
}: AccessControlSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-1">Access Control</h3>
      <p className="text-[12px] text-slate-400 mb-4">Restrict sensitive workspace actions</p>
      <ToggleRow
        label="Restrict data exports"
        description="Only workspace owners can export workspace data"
        checked={dataExportRestricted}
        onChange={() => onToggle("dataExportRestricted")}
      />
      <ToggleRow
        label="Require approval for role changes"
        description="Role changes must be approved by a second admin"
        checked={roleChangeApproval}
        onChange={() => onToggle("roleChangeApproval")}
      />
    </div>
  )
}
