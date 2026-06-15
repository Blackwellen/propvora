"use client"

import React, { useState } from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface SecurityPolicy {
  requireMfaAdmins: boolean
  requireMfaAll: boolean
  sessionTimeoutMinutes: number
  inviteExpiryHours: number
  magicLinkExpiryHours: number
  supplierLinkExpiryDays: number
  dataExportRestricted: boolean
  roleChangeApproval: boolean
}

export default function SecurityPage() {
  const [policy, setPolicy] = useState<SecurityPolicy>({
    requireMfaAdmins: false,
    requireMfaAll: false,
    sessionTimeoutMinutes: 1440,
    inviteExpiryHours: 72,
    magicLinkExpiryHours: 24,
    supplierLinkExpiryDays: 30,
    dataExportRestricted: false,
    roleChangeApproval: false,
  })
  const [isDirty, setIsDirty] = useState(false)

  function updatePolicy<K extends keyof SecurityPolicy>(key: K, value: SecurityPolicy[K]) {
    setPolicy((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  function ToggleRow({
    label,
    description,
    field,
  }: {
    label: string
    description?: string
    field: keyof Pick<SecurityPolicy, "requireMfaAdmins" | "requireMfaAll" | "dataExportRestricted" | "roleChangeApproval">
  }) {
    const value = policy[field] as boolean
    return (
      <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
        <div className="flex-1 pr-4">
          <p className="text-[13px] font-medium text-slate-800">{label}</p>
          {description && <p className="text-[11.5px] text-slate-400 mt-0.5">{description}</p>}
        </div>
        <button
          onClick={() => updatePolicy(field, !value)}
          className={cn(
            "w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5",
            value ? "bg-[#2563EB]" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "block w-4 h-4 rounded-full bg-white shadow-sm transition-transform m-1",
              value ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="relative pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-slate-900">Security</h1>
        <p className="text-[13px] text-slate-500 mt-0.5">
          Configure workspace-wide security policies and access controls
        </p>
      </div>

      {/* Security status widget */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-4">Workspace Security Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "MFA Policy",       status: "Not enforced", ok: false },
            { label: "Session Timeout",  status: "24 hours",     ok: true },
            { label: "Invite Expiry",    status: "72 hours",     ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className={cn(
                "p-4 rounded-xl border",
                item.ok
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              )}
            >
              <p className="text-[11px] font-semibold text-slate-600">{item.label}</p>
              <p
                className={cn(
                  "text-[12px] font-bold mt-1",
                  item.ok ? "text-emerald-700" : "text-amber-700"
                )}
              >
                {item.status}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MFA policy */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">MFA Policy</h3>
        <p className="text-[12px] text-slate-400 mb-4">
          Enforce multi-factor authentication for workspace members
        </p>
        <ToggleRow
          label="Require MFA for admins"
          description="Admins and owners must set up MFA before accessing the workspace"
          field="requireMfaAdmins"
        />
        <ToggleRow
          label="Require MFA for all users"
          description="All team members must set up MFA before accessing the workspace"
          field="requireMfaAll"
        />
      </div>

      {/* Session settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Session & Link Expiry</h3>
        <p className="text-[12px] text-slate-400 mb-4">
          Control how long sessions and invite links remain valid
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Session timeout (minutes)", field: "sessionTimeoutMinutes" as const, min: 60, max: 10080 },
            { label: "Invite expiry (hours)",      field: "inviteExpiryHours" as const,      min: 1,  max: 168  },
            { label: "Magic link expiry (hours)",  field: "magicLinkExpiryHours" as const,   min: 1,  max: 72   },
            { label: "Supplier link expiry (days)",field: "supplierLinkExpiryDays" as const, min: 1,  max: 365  },
          ].map(({ label, field, min, max }) => (
            <div key={field}>
              <label htmlFor={`sec-${field}`} className="block text-[12.5px] font-semibold text-slate-700 mb-1.5">{label}</label>
              <input
                id={`sec-${field}`}
                type="number"
                min={min}
                max={max}
                value={policy[field] as number}
                onChange={(e) => updatePolicy(field, parseInt(e.target.value) || min)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:border-[#2563EB] transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Access control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <h3 className="text-[14px] font-bold text-slate-900 mb-1">Access Control</h3>
        <p className="text-[12px] text-slate-400 mb-4">
          Restrict sensitive workspace actions
        </p>
        <ToggleRow
          label="Restrict data exports"
          description="Only workspace owners can export workspace data"
          field="dataExportRestricted"
        />
        <ToggleRow
          label="Require approval for role changes"
          description="Role changes must be approved by a second admin"
          field="roleChangeApproval"
        />
      </div>

      {/* Enterprise features */}
      <div className="bg-white rounded-2xl border border-violet-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ color: "#7C3AED" }}>
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900">Enterprise Security Features</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 ml-auto">
            Enterprise
          </span>
        </div>
        {[
          "IP Allowlist",
          "Domain Allowlist",
          "Advanced Session Policies",
          "Custom Password Policy",
          "Audit Trail Retention",
        ].map((f) => (
          <div
            key={f}
            className="flex items-center gap-2.5 py-2 border-b border-slate-50 last:border-0 opacity-50"
          >
            <div style={{ color: "#94A3B8" }}>
              <Lock className="w-3.5 h-3.5 shrink-0" />
            </div>
            <p className="text-[12.5px] text-slate-700">{f}</p>
          </div>
        ))}
        <button className="mt-4 w-full py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-[12.5px] font-semibold hover:bg-violet-100 transition-colors">
          Upgrade to Enterprise
        </button>
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 bg-white border-t border-slate-200 shadow-lg">
          <p className="text-[13px] text-slate-600">You have unsaved security policy changes</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDirty(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={() => setIsDirty(false)}
              className="px-5 py-2 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
            >
              Save policy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
