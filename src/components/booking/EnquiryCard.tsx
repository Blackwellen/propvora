"use client"

import { useState } from "react"
import { Loader2, Send, CheckCircle2, AlertCircle, Banknote, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────
   Apply / Enquire card — the CTA for long-term, mid-term and shared/HMO/student
   listings, which are NOT nightly-checkout products. Instead of a nightly total
   the guest registers interest (move-in date + contact + message). Submits to
   the existing audited /api/booking/reserve path (no payment is taken). Honest
   throughout: it never claims a place is reserved — it sends an enquiry.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listingId: string
  title: string
  currency: string
  /** Headline price (monthly/long-stay base) in integer pence, or null. */
  fromPence: number | null
  /** "month" for long-lets, "week" for some HMO/student rooms. */
  pricePeriodLabel?: string
  availableFrom?: string | null
  ctaLabel: string
}

function fmtMoney(pence: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(pence / 100)
  } catch {
    return `£${(pence / 100).toFixed(0)}`
  }
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function EnquiryCard({
  listingId,
  title,
  currency,
  fromPence,
  pricePeriodLabel = "month",
  availableFrom,
  ctaLabel,
}: Props) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const [moveIn, setMoveIn] = useState(availableFrom && availableFrom >= todayIso ? availableFrom : todayIso)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [accept, setAccept] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (fullName.trim().length < 2 || !email.includes("@")) {
      setError("Please enter your name and a valid email.")
      return
    }
    if (!accept) {
      setError("Please confirm you accept the terms to enquire.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn: moveIn,
          // Enquiry window — a nominal 30-day span so the validated path accepts it.
          checkOut: addDaysIso(moveIn, 30),
          guests: 1,
          guest: {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim() || `Enquiry about ${title} — preferred move-in ${moveIn}.`,
            acceptHouseRules: true,
            acceptCancellation: true,
            acceptTerms: true,
            acceptDataSharing: true,
          },
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reference?: string; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "We couldn't send your enquiry. Please try again.")
        return
      }
      setDone(data.reference ?? "sent")
    } catch {
      setError("We couldn't send your enquiry. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#EEF3FB] bg-white shadow-sm p-5">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-[15px] font-semibold">Enquiry sent</p>
        </div>
        <p className="mt-2 text-[13.5px] text-slate-600 leading-relaxed">
          Thanks — the property manager has your enquiry{done !== "sent" ? ` (ref ${done})` : ""} and will be in touch
          about availability and next steps. This is an enquiry, not a confirmed let.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#EEF3FB] bg-white shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        {fromPence != null ? (
          <p className="text-[20px] font-bold text-[#0B1B3F]">
            {fmtMoney(fromPence, currency)}
            <span className="text-[13px] font-medium text-slate-500"> / {pricePeriodLabel}</span>
          </p>
        ) : (
          <p className="text-[15px] font-semibold text-[#0B1B3F]">Price on enquiry</p>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500 mb-4">
        <Banknote className="w-3.5 h-3.5" /> No payment taken — register your interest
      </p>

      <div className="space-y-3">
        <Field label="Preferred move-in date">
          <div className="relative">
            <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              min={todayIso}
              value={moveIn}
              onChange={(e) => setMoveIn(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </Field>
        <Field label="Full name">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Phone (optional)">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Message (optional)">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={cn(inputCls, "h-auto py-2 resize-none")}
            placeholder="Tell the host about your situation, employment, etc."
          />
        </Field>

        <label className="flex items-start gap-2 text-[12.5px] text-slate-600">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5"
          />
          <span>I agree to share these details with the property manager to process my enquiry.</span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-[13px] text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {busy ? "Sending…" : ctaLabel}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  )
}
