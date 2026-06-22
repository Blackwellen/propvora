"use client"

import Link from "next/link"
import { CreditCard, ShieldCheck, Receipt } from "lucide-react"

// Saved cards live in Stripe (added securely at checkout), not stored or listed
// in the app. Propvora doesn't collect rent or set up direct debits (not FCA) —
// the landlord/agent arranges that directly. Receipts are per booking.
export default function PaymentMethodsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-[13px] font-bold text-slate-900 mb-2 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400" /> Payment methods</p>
        <p className="text-[12px] text-slate-500">You add a card securely at checkout, where it can be saved for next time. Card details are held by Stripe — never stored by Propvora.</p>
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
  )
}
