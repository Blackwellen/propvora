"use client"

import { useState } from "react"
import { X, LifeBuoy, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { customerInputClass } from "@/components/customer/ui"

type Contact = { name: string; phone: string; relationship?: string }

/**
 * Emergency contact — stored on the customer's auth user_metadata
 * (emergency_contact). No table needed; persists immediately.
 */
export function EmergencyContactModal({ initial, onClose, onSaved }: { initial: Contact | null; onClose: () => void; onSaved: (c: Contact) => void }) {
  const [name, setName] = useState(initial?.name ?? "")
  const [phone, setPhone] = useState(initial?.phone ?? "")
  const [relationship, setRelationship] = useState(initial?.relationship ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!name.trim() || !phone.trim()) { setError("Name and phone are required."); return }
    setBusy(true)
    try {
      const supabase = createClient()
      const contact: Contact = { name: name.trim(), phone: phone.trim(), relationship: relationship.trim() || undefined }
      const { error: err } = await supabase.auth.updateUser({ data: { emergency_contact: contact } })
      if (err) { setError(err.message); setBusy(false); return }
      onSaved(contact)
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center"><LifeBuoy className="w-4 h-4" /></span>
            <h2 className="text-[15px] font-semibold text-slate-900">Emergency contact</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Contact name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={customerInputClass + " mt-1"} placeholder="e.g. Jane Smith" /></label>
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={customerInputClass + " mt-1"} placeholder="+44 …" /></label>
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Relationship (optional)</span>
            <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className={customerInputClass + " mt-1"} placeholder="e.g. Partner" /></label>
          {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
            <button onClick={submit} disabled={busy} className="bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save contact</button>
          </div>
        </div>
      </div>
    </div>
  )
}
