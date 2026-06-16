"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { AdminWizard, Field, NativeSelect, type WizardStepDef } from "@/components/admin-wizard/AdminWizard"
import { createAffiliate } from "@/lib/admin/mutations"

const BAND_OPTIONS = [
  { value: "starter", label: "Starter — 10%" },
  { value: "growth", label: "Growth — 12%" },
  { value: "partner", label: "Partner — 15%" },
]
const ORIGIN_OPTIONS = [
  { value: "internal", label: "Internal (existing customer)" },
  { value: "external", label: "External applicant" },
]

export default function CreateAffiliateWizard({
  workspaces,
}: {
  workspaces: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [workspaceId, setWorkspaceId] = useState("")
  const [search, setSearch] = useState("")
  const [payoutEmail, setPayoutEmail] = useState("")
  const [band, setBand] = useState("starter")
  const [origin, setOrigin] = useState("internal")
  const [referralCode, setReferralCode] = useState("")
  const [approve, setApprove] = useState(true)

  const filtered = workspaces.filter((w) => !search || w.name.toLowerCase().includes(search.toLowerCase())).slice(0, 40)
  const selected = workspaces.find((w) => w.id === workspaceId)

  async function handleSubmit() {
    setSubmitting(true); setError(null)
    const res = await createAffiliate({
      workspaceId,
      payoutEmail: payoutEmail || undefined,
      band,
      origin,
      referralCode: referralCode || undefined,
      approve,
    })
    setSubmitting(false)
    if (!res.ok) { setError(res.error ?? "Could not enrol affiliate."); return }
    setOpen(false)
    if (workspaceId) router.push(`/admin/affiliates/${workspaceId}`)
    else router.refresh()
  }

  const steps: WizardStepDef[] = [
    {
      key: "workspace",
      label: "Workspace",
      subtitle: "Who is enrolling",
      validate: () => !!workspaceId,
      content: (
        <div className="space-y-3 max-w-md">
          <Field label="Workspace" required hint="Affiliates are keyed by workspace. Only un-enrolled workspaces appear.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input placeholder="Search workspaces…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </Field>
          <div className="max-h-56 overflow-y-auto rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No un-enrolled workspaces</p>
            ) : filtered.map((w) => (
              <button key={w.id} type="button" onClick={() => setWorkspaceId(w.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${workspaceId === w.id ? "bg-[#F5F3FF]" : "hover:bg-slate-50"}`}>
                <span className="text-[13px] font-medium text-slate-800 truncate">{w.name}</span>
                {workspaceId === w.id && <span className="text-[11px] font-semibold text-[#7C3AED]">Selected</span>}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "terms",
      label: "Terms",
      subtitle: "Band & payout",
      content: (
        <div className="space-y-4 max-w-md">
          <Field label="Commission band"><NativeSelect value={band} onChange={setBand} options={BAND_OPTIONS} /></Field>
          <Field label="Origin"><NativeSelect value={origin} onChange={setOrigin} options={ORIGIN_OPTIONS} /></Field>
          <Field label="Payout email" hint="Where commission statements go (optional)."><Input type="email" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)} /></Field>
          <Field label="Referral code" hint="Leave blank to auto-generate."><Input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="AUTO" /></Field>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={approve} onChange={(e) => setApprove(e.target.checked)} className="w-4 h-4 rounded accent-[#7C3AED]" />
            <span className="text-[13px] text-slate-700">Approve immediately (commission accrues right away)</span>
          </label>
        </div>
      ),
    },
    {
      key: "review",
      label: "Review",
      subtitle: "Confirm & enrol",
      content: (
        <div className="max-w-md space-y-3">
          <dl className="rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] text-[13px]">
            {[
              ["Workspace", selected?.name ?? "—"],
              ["Band", BAND_OPTIONS.find((b) => b.value === band)?.label ?? band],
              ["Origin", ORIGIN_OPTIONS.find((o) => o.value === origin)?.label ?? origin],
              ["Payout email", payoutEmail || "—"],
              ["Referral code", referralCode || "Auto-generated"],
              ["Status", approve ? "Approved" : "Pending approval"],
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
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#7C3AED] text-white text-[13px] font-semibold hover:bg-violet-700 transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> New Affiliate
      </button>
      <AdminWizard open={open} onOpenChange={setOpen} title="New Affiliate" subtitle="Enrol a workspace"
        steps={steps} submitLabel="Enrol Affiliate" submitting={submitting} error={error} onSubmit={handleSubmit} />
    </>
  )
}
