"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { NativeSelect } from "@/components/admin-wizard/AdminWizard"
import { updateAffiliate } from "@/lib/admin/mutations"

const BAND_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "partner", label: "Partner" },
]
const ORIGIN_OPTIONS = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
]

export default function AffiliateEdit({
  workspaceId, band, payoutEmail, origin,
}: {
  workspaceId: string
  band: string
  payoutEmail: string | null
  origin: string
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [b, setB] = useState(band)
  const [email, setEmail] = useState(payoutEmail ?? "")
  const [o, setO] = useState(origin)

  async function save() {
    setSaving(true); setError(null)
    const res = await updateAffiliate(workspaceId, { band: b, payoutEmail: email || null, origin: o })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? "Failed"); return }
    setEditing(false)
    startTransition(() => router.refresh())
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C3AED] hover:underline">
        <Pencil className="w-3.5 h-3.5" /> Edit terms
      </button>
    )
  }

  return (
    <div className="space-y-3 mt-2">
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[12px] text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Band</span><NativeSelect value={b} onChange={setB} options={BAND_OPTIONS} /></label>
        <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Origin</span><NativeSelect value={o} onChange={setO} options={ORIGIN_OPTIONS} /></label>
        <Input label="Payout email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#7C3AED] text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Save</button>
        <button onClick={() => { setEditing(false); setB(band); setEmail(payoutEmail ?? ""); setO(origin) }} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-slate-600 hover:bg-slate-50"><X className="w-3.5 h-3.5" /> Cancel</button>
      </div>
    </div>
  )
}
