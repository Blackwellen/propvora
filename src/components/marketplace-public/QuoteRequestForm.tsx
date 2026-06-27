"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, Send, Calendar } from "lucide-react"

/* ──────────────────────────────────────────────────────────────────────────
   QuoteRequestForm — the REAL supplier/emergency primary CTA.

   POSTs to /api/marketplace/enquiries, which writes a `marketplace_enquiries`
   row (anon-insertable via RLS) the seller reads from their dashboard. This is
   a genuine write — NOT a setState no-op. Honest success/error states.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  listingId: string
  /** Pre-fill from an authenticated session, if available. */
  defaultEmail?: string | null
  defaultName?: string | null
  /** Buyer workspace id when an operator is signed in. */
  buyerWorkspaceId?: string | null
  /** Emergency intents word the CTA more urgently. */
  urgent?: boolean
  /** Pre-fill a preferred date (ISO string) from search params. */
  preferredDate?: string | null
}

type Phase = "form" | "submitting" | "done"

export default function QuoteRequestForm({ listingId, defaultEmail, defaultName, buyerWorkspaceId, urgent, preferredDate }: Props) {
  const [phase, setPhase] = useState<Phase>("form")
  const [name, setName] = useState(defaultName ?? "")
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [date, setDate] = useState(preferredDate ?? "")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!message.trim()) {
      setError("Please describe what you need.")
      return
    }
    if (!defaultEmail && !email.trim()) {
      setError("Please add an email so the supplier can reply.")
      return
    }
    setPhase("submitting")
    try {
      const res = await fetch("/api/marketplace/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          name: name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          message: message.trim(),
          preferredDate: date.trim() || null,
          buyerWorkspaceId: buyerWorkspaceId ?? null,
          gdprConsent: consent,
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? "We couldn't send your enquiry. Please try again.")
        setPhase("form")
        return
      }
      setPhase("done")
    } catch {
      setError("We couldn't send your enquiry. Please try again.")
      setPhase("form")
    }
  }

  if (phase === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-2.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[13.5px] font-semibold text-emerald-800">Enquiry sent</p>
          <p className="text-[12.5px] text-emerald-700 mt-0.5">
            The supplier has received your request and will respond
            {urgent ? " as a priority" : " shortly"}. We&apos;ve recorded your contact details so they can reply.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {!defaultName && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        />
      )}
      {!defaultEmail && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        />
      )}
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone (optional)"
        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
      />
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          aria-label="Preferred date (optional)"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder={urgent ? "Describe the emergency and your location…" : "Describe the job, timing and location…"}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13.5px] text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 resize-none"
      />
      <label className="flex items-start gap-2 text-[11.5px] text-slate-500">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-[var(--brand)]"
        />
        I agree my details may be shared with this supplier so they can respond.
      </label>
      {error && (
        <p className="text-[12.5px] text-red-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={phase === "submitting"}
        className="w-full h-11 rounded-xl bg-[var(--brand)] text-white text-[14px] font-semibold shadow-[0_2px_10px_rgba(37,99,235,0.30)] hover:bg-[var(--brand-strong)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {phase === "submitting" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="w-4 h-4" /> {urgent ? "Request urgent call-out" : "Request a quote"}</>
        )}
      </button>
    </form>
  )
}
