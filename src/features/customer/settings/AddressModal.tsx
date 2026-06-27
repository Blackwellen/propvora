"use client"

import { useState } from "react"
import { X, MapPin, Loader2 } from "lucide-react"
import { customerInputClass } from "@/components/customer/ui"

/**
 * Add a saved address — POSTs to /api/customer/addresses (customer_saved_addresses).
 */
export function AddressModal({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [label, setLabel] = useState("Home")
  const [line1, setLine1] = useState("")
  const [line2, setLine2] = useState("")
  const [city, setCity] = useState("")
  const [postcode, setPostcode] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!line1.trim() || !city.trim() || !postcode.trim()) {
      setError("Address line 1, city and postcode are required.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label, line1, line2, city, postcode, isDefault }),
      })
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null
        setError(b?.error ?? "Could not save the address.")
        setBusy(false)
        return
      }
      onSaved("Address saved.")
      onClose()
    } catch {
      setError("Something went wrong. Please try again.")
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--brand-soft)] text-[var(--brand)] flex items-center justify-center"><MapPin className="w-4 h-4" /></span>
            <h2 className="text-[15px] font-semibold text-slate-900">Add address</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className={customerInputClass + " mt-1"} placeholder="Home" /></label>
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Address line 1</span>
            <input value={line1} onChange={(e) => setLine1(e.target.value)} className={customerInputClass + " mt-1"} placeholder="123 High Street" /></label>
          <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Address line 2 (optional)</span>
            <input value={line2} onChange={(e) => setLine2(e.target.value)} className={customerInputClass + " mt-1"} placeholder="Flat 2" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[12.5px] font-medium text-slate-600">City</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={customerInputClass + " mt-1"} placeholder="London" /></label>
            <label className="block"><span className="text-[12.5px] font-medium text-slate-600">Postcode</span>
              <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className={customerInputClass + " mt-1"} placeholder="SW1A 1AA" /></label>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Set as default address
          </label>
          {error && <p className="text-[12.5px] text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="border border-slate-200 rounded-xl px-4 py-2 text-[12.5px] font-semibold text-slate-700">Cancel</button>
            <button onClick={submit} disabled={busy} className="bg-[var(--brand)] text-white rounded-xl px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save address
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
