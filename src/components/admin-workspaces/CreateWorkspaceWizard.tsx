"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { AdminWizard, Field, NativeSelect, type WizardStepDef } from "@/components/admin-wizard/AdminWizard"
import { createWorkspace } from "@/lib/admin/mutations"
import type { UserPick } from "@/lib/admin/data"

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "operator", label: "Operator" },
  { value: "scale", label: "Scale" },
  { value: "pro_agency", label: "Pro Agency" },
  { value: "enterprise", label: "Enterprise" },
]
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "trialing", label: "Trialing" },
  { value: "suspended", label: "Suspended" },
]
const CURRENCY_OPTIONS = [
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
]

export default function CreateWorkspaceWizard({ users }: { users: UserPick[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [ownerId, setOwnerId] = useState("")
  const [ownerSearch, setOwnerSearch] = useState("")
  const [plan, setPlan] = useState("starter")
  const [status, setStatus] = useState("active")
  const [currency, setCurrency] = useState("GBP")

  const filteredUsers = users.filter((u) => {
    if (!ownerSearch) return true
    const q = ownerSearch.toLowerCase()
    return (u.name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q)
  }).slice(0, 40)
  const owner = users.find((u) => u.id === ownerId)

  async function handleSubmit() {
    setSubmitting(true); setError(null)
    const res = await createWorkspace({
      name,
      ownerUserId: ownerId,
      plan: plan as never,
      planStatus: status as "active" | "trialing" | "suspended",
      defaultCurrency: currency,
    })
    setSubmitting(false)
    if (!res.ok) { setError(res.error ?? "Could not create workspace."); return }
    setOpen(false)
    if (res.data?.id) router.push(`/admin/workspaces/${res.data.id}`)
    else router.refresh()
  }

  const steps: WizardStepDef[] = [
    {
      key: "basics",
      label: "Basics",
      subtitle: "Name the workspace",
      validate: () => name.trim().length > 1,
      content: (
        <div className="space-y-4 max-w-md">
          <Field label="Workspace name" required hint="A unique slug is generated automatically.">
            <Input placeholder="Acme Property Co" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Default currency"><NativeSelect value={currency} onChange={setCurrency} options={CURRENCY_OPTIONS} /></Field>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      subtitle: "Assign an owner",
      validate: () => !!ownerId,
      content: (
        <div className="space-y-3 max-w-md">
          <Field label="Owner" required hint="The owner becomes an owner-role member of the new workspace.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input placeholder="Search users by name or email…" className="pl-9" value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} />
            </div>
          </Field>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No matching users</p>
            ) : filteredUsers.map((u) => (
              <button key={u.id} type="button" onClick={() => setOwnerId(u.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${ownerId === u.id ? "bg-[#EFF6FF]" : "hover:bg-slate-50"}`}>
                <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {(u.name || u.email || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-800 truncate">{u.name ?? "—"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{u.email ?? u.id.slice(0, 8)}</p>
                </div>
                {ownerId === u.id && <span className="ml-auto text-[11px] font-semibold text-[#2563EB]">Selected</span>}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      subtitle: "Tier & status",
      content: (
        <div className="space-y-4 max-w-md">
          <Field label="Plan tier"><NativeSelect value={plan} onChange={setPlan} options={PLAN_OPTIONS} /></Field>
          <Field label="Billing status"><NativeSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} /></Field>
        </div>
      ),
    },
    {
      key: "review",
      label: "Review",
      subtitle: "Confirm & create",
      content: (
        <div className="max-w-md space-y-3">
          <p className="text-[13px] text-slate-500">A real workspace will be created with the selected owner and the action audited.</p>
          <dl className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] text-[13px]">
            {[
              ["Name", name || "—"],
              ["Owner", owner ? (owner.name ?? owner.email ?? "—") : "—"],
              ["Plan", PLAN_OPTIONS.find((p) => p.value === plan)?.label ?? plan],
              ["Status", STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status],
              ["Currency", currency],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-slate-400">{k}</dt><dd className="font-medium text-slate-800 text-right truncate">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ]

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4fd7] transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> New Workspace
      </button>
      <AdminWizard open={open} onOpenChange={setOpen} title="New Workspace" subtitle="Provision a tenant"
        steps={steps} submitLabel="Create Workspace" submitting={submitting} error={error} onSubmit={handleSubmit} />
    </>
  )
}
