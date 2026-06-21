"use client"

import React, { useState } from "react"
import { CreditCard } from "lucide-react"
import { openBillingPortal } from "@/lib/billing/checkout"

export interface PaymentMethodSectionProps {}

export function PaymentMethodSection(_props: PaymentMethodSectionProps) {
  const [portalError, setPortalError] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#2563EB]/10">
          <CreditCard className="w-4 h-4 text-[#2563EB]" />
        </div>
        <h3 className="text-[14px] font-bold text-slate-900">Payment Method</h3>
      </div>
      <p className="text-[12.5px] text-slate-500 mb-4">
        Cards and payment methods are stored securely by Stripe. Add, update or remove a
        card from the Stripe billing portal — Propvora never sees your full card details.
      </p>
      <button
        onClick={async () => {
          setPortalError(null)
          try {
            await openBillingPortal()
          } catch (e) {
            setPortalError(e instanceof Error ? e.message : "Portal unavailable")
          }
        }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-[13px] font-semibold hover:bg-[#1d4ed8] transition-colors"
      >
        <CreditCard className="w-4 h-4" />
        Manage payment methods
      </button>
      {portalError && <p className="text-[11px] text-red-500 mt-2">{portalError}</p>}
    </div>
  )
}

export default PaymentMethodSection
