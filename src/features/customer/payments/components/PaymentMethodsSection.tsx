"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CreditCard, ShieldCheck, Receipt, Plus, Trash2, Loader2 } from "lucide-react"
import { AddCardModal } from "./AddCardModal"

interface CardPM { id: string; brand: string; last4: string; expMonth: number | null; expYear: number | null }

// Self-service saved cards backed by Stripe (SetupIntent). Card data is entered
// into Stripe's Payment Element and never touches Propvora's servers. Receipts are
// per booking; deposit protection is escrow-based.
export default function PaymentMethodsSection() {
  const [cards, setCards] = useState<CardPM[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/customer/payment-methods", { headers: { accept: "application/json" } })
      if (res.ok) { const data = (await res.json()) as { items?: CardPM[] }; setCards(data.items ?? []) }
    } catch { /* ignore */ } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function remove(id: string) {
    setRemovingId(id)
    try {
      const res = await fetch(`/api/customer/payment-methods?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (res.ok) setCards((c) => c.filter((x) => x.id !== id))
    } catch { /* ignore */ } finally { setRemovingId(null) }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Saved cards manager */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400" /> Saved cards</p>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600"><Plus className="w-3.5 h-3.5" /> Add card</button>
          </div>
          {loading ? (
            <div className="py-4 flex justify-center text-slate-300"><Loader2 className="w-4 h-4 animate-spin" /></div>
          ) : cards.length === 0 ? (
            <p className="text-[12px] text-slate-500">No saved cards yet. Add one for faster checkout — held securely by Stripe, never by Propvora.</p>
          ) : (
            <ul className="space-y-1.5">
              {cards.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-[12.5px] text-slate-700 capitalize">{c.brand} •••• {c.last4}{c.expMonth ? ` · ${String(c.expMonth).padStart(2, "0")}/${String(c.expYear).slice(-2)}` : ""}</span>
                  <button onClick={() => remove(c.id)} disabled={removingId === c.id} aria-label="Remove card" className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-100">{removingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-2 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-400" /> How payments are protected</p>
          <p className="text-[12px] text-slate-500">Stay payments are held in escrow and released to the host after a successful stay, so your money is protected if something goes wrong.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <p className="text-[13px] font-bold text-slate-900 mb-2 flex items-center gap-1.5"><Receipt className="w-4 h-4 text-slate-400" /> Receipts</p>
          <p className="text-[12px] text-slate-500">A receipt is available on each booking once payment completes.</p>
          <Link href="/customer/bookings" className="mt-2 inline-block text-[12px] font-semibold text-blue-600">View your bookings →</Link>
        </div>
      </div>

      {showAdd && <AddCardModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </>
  )
}
