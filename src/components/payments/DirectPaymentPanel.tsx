"use client"

// ============================================================================
// DirectPaymentPanel — reusable FCA-safe "pay your payee DIRECTLY + record it"
// panel. Propvora does NOT process or hold the money. Used for:
//   • supplier-job invoices (mode="single", table="supplier_jobs")
//   • tenant rent          (mode="append", table="tenancies")
// Light tokens only — NEVER `dark:`.
// ============================================================================

import { useState } from "react"
import { Banknote, CheckCircle2, Landmark, Loader2 } from "lucide-react"
import {
  recordDirectPayment,
  clearDirectPayment,
  recordRentReceipt,
  type DirectPaymentTable,
  type PaymentMethod,
} from "@/lib/payments/direct-payment"

export interface RecordedPayment {
  id?: string
  status?: string
  amount_pence?: number
  method?: string
  reference?: string | null
  period?: string | null
  paid_at?: string
}

export interface DirectPaymentPanelProps {
  table: DirectPaymentTable
  id: string
  /** "single" = one-off (job invoice) · "append" = recurring (rent). */
  mode?: "single" | "append"
  title?: string
  /** Suggested amount in pence (invoice amount / monthly rent). */
  defaultAmountPence?: number
  payeeName?: string
  payeeBank?: { accountName?: string; sortCode?: string; accountNumber?: string } | null
  /** For mode="single" pass the single recorded payment; for "append" pass the list. */
  payment?: RecordedPayment | null
  payments?: RecordedPayment[]
  /** Period label for recurring (e.g. "Aug 2026"). */
  periodLabel?: string
  /** Allowed methods (rent often allows direct_debit). */
  methods?: { value: PaymentMethod; label: string }[]
  revalidate?: string
  /** Copy describing who the payee is, e.g. "your supplier" / "your landlord". */
  payeeNoun?: string
  /** Override the explanatory note (e.g. for "record rent received"). */
  note?: string
  /** Override the record button label. */
  recordLabel?: string
  /**
   * RENT mode: when set, recording writes a real money_transactions rent receipt
   * (FCA-safe — never Propvora-collected) instead of row metadata. `payments`
   * (history) is supplied by the parent from the ledger.
   */
  rentTenancyId?: string
}

const DEFAULT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
]

const fmt = (p?: number) => `£${((p ?? 0) / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function DirectPaymentPanel(props: DirectPaymentPanelProps) {
  const mode = props.mode ?? "single"
  const methods = props.methods ?? DEFAULT_METHODS
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [amount, setAmount] = useState(((props.defaultAmountPence ?? 0) / 100 || 0).toFixed(2))
  const [method, setMethod] = useState<PaymentMethod>(methods[0]?.value ?? "bank_transfer")
  const [reference, setReference] = useState("")

  const single = mode === "single" ? props.payment : null
  const list = mode === "append" ? props.payments ?? [] : []
  const isPaidSingle = single?.status === "paid"

  async function submit() {
    setBusy(true); setErr(null)
    const amountPence = Math.round(parseFloat(amount || "0") * 100)
    const res = props.rentTenancyId
      ? await recordRentReceipt({
          tenancyId: props.rentTenancyId, amountPence, method, reference,
          period: props.periodLabel, revalidate: props.revalidate,
        })
      : await recordDirectPayment({
          table: props.table, id: props.id, mode, amountPence,
          method, reference, periodLabel: props.periodLabel, revalidate: props.revalidate,
        })
    setBusy(false)
    if (!res.ok) { setErr(res.error ?? "Could not record the payment."); return }
    setOpen(false)
    if (typeof window !== "undefined") window.location.reload()
  }

  async function clear(paymentId?: string) {
    setBusy(true)
    await clearDirectPayment({ table: props.table, id: props.id, mode, paymentId, revalidate: props.revalidate })
    setBusy(false)
    if (typeof window !== "undefined") window.location.reload()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Banknote className="h-4 w-4" /></span>
        <h3 className="text-[15px] font-bold text-slate-900">{props.title ?? "Payment"}</h3>
        {isPaidSingle && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
          </span>
        )}
      </div>

      <p className="mb-3 text-[12.5px] leading-relaxed text-slate-500">
        {props.note ?? (
          <>Pay {props.payeeNoun ?? "the payee"} <strong className="text-slate-700">directly</strong> (e.g. bank transfer),
          then record it here so it reconciles. Propvora doesn&apos;t process or hold this payment.</>
        )}
      </p>

      {props.payeeBank?.sortCode || props.payeeBank?.accountNumber ? (
        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[12.5px]">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700"><Landmark className="h-3.5 w-3.5" /> Pay to{props.payeeName ? ` · ${props.payeeName}` : ""}</p>
          {props.payeeBank.accountName && <p className="text-slate-600">{props.payeeBank.accountName}</p>}
          <p className="tabular-nums text-slate-600">
            {props.payeeBank.sortCode && <>Sort {props.payeeBank.sortCode} · </>}
            {props.payeeBank.accountNumber && <>Acc {props.payeeBank.accountNumber}</>}
          </p>
        </div>
      ) : (
        <p className="mb-3 text-[12px] text-slate-400">No payee bank details on file — add them on the {props.payeeNoun ?? "payee"}&apos;s record.</p>
      )}

      {/* Recurring history (append mode) */}
      {mode === "append" && list.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {list.slice().reverse().map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2 text-[12.5px]">
              <span className="text-slate-600">
                {p.period ? <strong className="text-slate-800">{p.period}</strong> : null} {fmt(p.amount_pence)} · {(p.method ?? "").replace("_", " ")}{p.paid_at ? ` · ${p.paid_at}` : ""}
              </span>
              {!props.rentTenancyId && (
                <button onClick={() => clear(p.id)} disabled={busy} className="shrink-0 text-[12px] font-semibold text-slate-400 hover:text-slate-600">Undo</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Single paid state */}
      {mode === "single" && isPaidSingle ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-[13px]">
          <span className="text-slate-600">
            {fmt(single?.amount_pence)} · {(single?.method ?? "").replace("_", " ")}{single?.reference ? ` · ref ${single.reference}` : ""}{single?.paid_at ? ` · ${single.paid_at}` : ""}
          </span>
          <button onClick={() => clear()} disabled={busy} className="shrink-0 text-[12.5px] font-semibold text-slate-400 hover:text-slate-600">Undo</button>
        </div>
      ) : open ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-slate-500">Amount (£)</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-[13px] outline-none focus:border-[#2563EB]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] font-semibold text-slate-500">Method</span>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[13px] outline-none focus:border-[#2563EB]">
                {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold text-slate-500">Reference (optional)</span>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Payment reference" className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-[13px] outline-none focus:border-[#2563EB]" />
          </label>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Record payment
            </button>
            <button onClick={() => setOpen(false)} className="h-9 rounded-lg border border-slate-200 px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]">
          <Banknote className="h-4 w-4" /> {props.recordLabel ?? (mode === "append" ? "Record a rent payment" : "Record a payment")}
        </button>
      )}
    </div>
  )
}
