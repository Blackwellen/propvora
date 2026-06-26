"use client"

import { useState } from "react"
import { X, CreditCard, Building2, Copy, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import PaymentForm from "@/components/payments/PaymentForm"

export interface BankDetails {
  accountName: string | null
  sortCode: string | null
  accountNumber: string | null
  reference: string | null
}

interface Props {
  rentPcm: number | null
  sessionId: string
  bankDetails: BankDetails | null
  onClose: () => void
}

type Tab = "card" | "bank"
type CardPhase = "idle" | "done"

function money(n: number | null | undefined) {
  if (n == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)
}

function CopyField({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2 bg-[#F8FAFF] border border-[#E2EAF6] rounded-xl px-4 py-3">
      <div><p className="text-[11px] text-slate-400 mb-0.5">{label}</p><p className="text-sm font-bold text-[#071B4D] tracking-wide">{value}</p></div>
      <button
        onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="w-8 h-8 rounded-lg bg-white border border-[#E2EAF6] flex items-center justify-center text-slate-400 hover:text-[#2563EB] hover:border-[#2563EB] transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function TenantPaymentModal({ rentPcm, sessionId, bankDetails, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(bankDetails ? "bank" : "card")
  const [cardPhase, setCardPhase] = useState<CardPhase>("idle")

  const hasBankDetails = !!(bankDetails?.accountNumber || bankDetails?.sortCode)

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Make a payment">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF3FB]">
          <div>
            <h2 className="text-base font-bold text-[#071B4D]">Make a payment</h2>
            {rentPcm != null && <p className="text-xs text-slate-400 mt-0.5">Rent: {money(rentPcm)} / month</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {hasBankDetails && (
          <div className="flex gap-1 bg-[#F8FAFF] border-b border-[#EEF3FB] px-4 pt-3 pb-0">
            {([["bank", Building2, "Bank transfer"], ["card", CreditCard, "Pay by card"]] as const).map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition-colors",
                  tab === t
                    ? "bg-white text-[#2563EB] border-[#E2EAF6]"
                    : "bg-transparent text-slate-400 border-transparent hover:text-slate-600"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Bank transfer tab */}
          {tab === "bank" && hasBankDetails && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-sm font-semibold text-[#1E3A8A] mb-0.5">Pay by standing order or bank transfer</p>
                <p className="text-xs text-blue-700">Transfer your rent directly to the account below. Use your name and tenancy reference so your payment is matched correctly.</p>
              </div>
              <div className="space-y-2.5">
                {bankDetails?.accountName && (
                  <div className="bg-[#F8FAFF] border border-[#E2EAF6] rounded-xl px-4 py-3">
                    <p className="text-[11px] text-slate-400 mb-0.5">Account name</p>
                    <p className="text-sm font-bold text-[#071B4D]">{bankDetails.accountName}</p>
                  </div>
                )}
                <CopyField label="Sort code" value={bankDetails?.sortCode ?? null} />
                <CopyField label="Account number" value={bankDetails?.accountNumber ?? null} />
                {bankDetails?.reference && <CopyField label="Your payment reference" value={bankDetails.reference} />}
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
                Always include your payment reference so your manager can match the payment. Contact your manager if you need help setting up a standing order.
              </div>
            </div>
          )}

          {/* Card payment tab */}
          {tab === "card" && (
            <div className="space-y-4">
              {cardPhase === "done" ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-7 h-7 text-emerald-600" /></span>
                  <div><p className="text-base font-bold text-[#071B4D]">Payment submitted</p><p className="text-sm text-slate-500 mt-1">Your manager will confirm once funds clear.</p></div>
                  <button onClick={onClose} className="h-10 px-6 rounded-xl bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors">Done</button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                    <p className="text-sm font-semibold text-[#1E3A8A] mb-0.5">Pay securely by card</p>
                    <p className="text-xs text-blue-700">Your payment is encrypted and processed by Stripe. Card details are never stored on Propvora.</p>
                  </div>
                  <PaymentForm
                    bookingRef={sessionId}
                    amountPence={(rentPcm ?? 0) * 100}
                    currency="GBP"
                    intentRequest={{ url: "/api/portal/tenant/payment-intent", body: {} }}
                    footerNote="Secured by Stripe · Your rent is charged securely and a receipt is sent to you. Card details are never stored on Propvora."
                    onResult={(result) => {
                      if (result.intentStatus === "succeeded" || result.intentStatus === "processing") {
                        setCardPhase("done")
                      }
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
