"use client"

// ============================================================================
// StayCheckoutFlow — the REAL guest stay checkout (no modelled payment):
//   1. Details  — guest info + legal acceptances → POST /api/booking/reserve
//                 (server recomputes price, holds the booking via the
//                 create_public_reservation RPC, returns a reservationId).
//   2. Payment  — <PaymentForm bookingRef> → POST /api/payments/intent →
//                 Stripe Payment Element (card / Google Pay / Apple Pay) →
//                 confirmPayment → funds AUTHORISED + HELD in escrow.
//   3. Review   — honest confirmation (escrow held; captured on completion).
//
// When the listing isn't a real published DB listing yet (seed marketplace),
// reserve returns 503 ready:false and we show an honest "not available yet"
// state instead of pretending. Light tokens only — NEVER `dark:`.
// ============================================================================

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sparkles, Tag,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { CheckoutShell, type CheckoutStep } from "@/features/checkout/components/CheckoutShell"
import {
  SectionCard, Field, TextInput, CheckRow, CountedTextArea, PrimaryButton, GhostButton, useToast,
} from "@/features/checkout/components/primitives"
import PaymentForm from "@/components/payments/PaymentForm"

export interface StayCheckoutFlowProps {
  listingId: string
  heading: string
  subheading?: string
  thumbUrl?: string
  checkIn?: string
  checkOut?: string
  guests: number
  nights: number
  lineItems: { label: string; pence: number }[]
  currency?: string
  included?: string[]
  trustChips?: string[]
  backHref: string
  backLabel?: string
  successHref?: string
  successHrefLabel?: string
}

export default function StayCheckoutFlow(props: StayCheckoutFlowProps) {
  const currency = props.currency ?? "GBP"
  const toast = useToast()

  const [step, setStep] = useState<CheckoutStep>("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [acceptAll, setAcceptAll] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [notReady, setNotReady] = useState<string | null>(null)

  const [reservationId, setReservationId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [intentStatus, setIntentStatus] = useState<string | null>(null)

  const totalPence = useMemo(
    () => props.lineItems.reduce((s, l) => s + l.pence, 0),
    [props.lineItems]
  )

  async function reserve() {
    if (!name.trim() || !email.trim()) {
      toast.show("Add your name and email to continue", "err")
      return
    }
    if (!acceptAll) {
      toast.show("Please accept the house rules, cancellation policy and terms", "err")
      return
    }
    if (!props.checkIn || !props.checkOut) {
      toast.show("Select your dates on the stay page first", "err")
      return
    }
    setReserving(true)
    setNotReady(null)
    try {
      const res = await fetch("/api/booking/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: props.listingId,
          checkIn: props.checkIn,
          checkOut: props.checkOut,
          guests: props.guests,
          guest: {
            fullName: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            message: message.trim(),
            acceptHouseRules: true,
            acceptCancellation: true,
            acceptTerms: true,
            acceptDataSharing: true,
          },
        }),
      })
      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null
      if (res.status === 503) {
        setNotReady(
          (data?.error as string) ??
            "Online booking isn't available for this stay yet. The host will be in touch to confirm."
        )
        setReserving(false)
        return
      }
      if (res.status === 409) {
        toast.show((data?.error as string) ?? "Those dates are no longer available.", "err")
        setReserving(false)
        return
      }
      if (!res.ok || !(data?.reservationId || data?.reference)) {
        toast.show((data?.error as string) ?? "We couldn't hold your booking. Please try again.", "err")
        setReserving(false)
        return
      }
      const ref = (data.reservationId as string) ?? (data.reference as string)
      setReservationId(ref)
      setStep("payment")
      setReserving(false)
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      toast.show("We couldn't hold your booking. Please try again.", "err")
      setReserving(false)
    }
  }

  function onPaid(result: { intentStatus: string | null; paymentId: string | null }) {
    setIntentStatus(result.intentStatus)
    setConfirmed(true)
    setStep("review")
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ── Order summary ──
  const summary = (
    <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-sm">
      <div className="flex gap-3 border-b border-[#EEF2F9] p-4">
        {props.thumbUrl ? (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={props.thumbUrl} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2563EB]">
            <MapPin className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-[#0B1B3F]">{props.heading}</p>
          {props.subheading && <p className="mt-0.5 text-[12px] text-slate-500">{props.subheading}</p>}
        </div>
      </div>
      <div className="space-y-1.5 border-b border-[#EEF2F9] px-4 py-3 text-[12.5px]">
        <Row label="Check-in" value={fmtDate(props.checkIn)} />
        <Row label="Check-out" value={fmtDate(props.checkOut)} />
        <Row label="Guests" value={`${props.guests} ${props.guests === 1 ? "guest" : "guests"}`} />
      </div>
      <div className="space-y-2 px-4 py-3 text-[13px]">
        {props.lineItems.map((l) => (
          <div key={l.label} className="flex items-start justify-between gap-3 text-slate-600">
            <span className="min-w-0 break-words">{l.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-[#0B1B3F]">{formatPence(l.pence, currency)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[#EEF2F9] px-4 py-3.5">
        <span className="text-[14px] font-bold text-[#0B1B3F]">Total</span>
        <span className="text-[18px] font-extrabold tabular-nums text-[#0B1B3F]">{formatPence(totalPence, currency)}</span>
      </div>
      {props.included && props.included.length > 0 && (
        <div className="border-t border-[#EEF2F9] px-4 py-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <Sparkles className="h-3 w-3" /> What's included
          </p>
          <ul className="space-y-1">
            {props.included.map((i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="min-w-0 break-words">{i}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {props.trustChips && props.trustChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#EEF2F9] px-4 py-3">
          {props.trustChips.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-[#F1F6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
              <ShieldCheck className="h-3 w-3" /> {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  // ── Confirmation ──
  if (confirmed) {
    const held = intentStatus === "requires_capture" || intentStatus === "succeeded" || intentStatus === "processing"
    return (
      <CheckoutShell step="review" title="Booking confirmed" summary={summary}>
        <SectionCard title={held ? "Payment authorised — funds held in escrow" : "Booking received"}>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">{props.heading}</p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {fmtDate(props.checkIn)} → {fmtDate(props.checkOut)} · {props.nights} night{props.nights === 1 ? "" : "s"}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                {held
                  ? <>Your card was authorised for <strong className="font-semibold text-[#0B1B3F]">{formatPence(totalPence, currency)}</strong> and the funds are <strong>held securely in escrow</strong> — released to the host only after check-out. A confirmation has been sent to <strong className="font-semibold text-[#0B1B3F]">{email}</strong>.</>
                  : <>Your booking has been received. We&apos;ll confirm shortly and email <strong className="font-semibold text-[#0B1B3F]">{email}</strong>.</>}
              </p>
              {reservationId && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F1F6FF] px-3 py-1.5 text-[12.5px] font-semibold text-[#1D4ED8]">
                  <Tag className="h-3.5 w-3.5" /> Reference {reservationId.slice(0, 8).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
        <Link
          href={props.successHref ?? "/customer/bookings"}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
        >
          {props.successHrefLabel ?? "View my bookings"} <ArrowRight className="h-4 w-4" />
        </Link>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step={step} title="Complete your booking" summary={summary}>
      <Link href={props.backHref} className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-[#1D4ED8]">
        <ArrowLeft className="h-3.5 w-3.5" /> {props.backLabel ?? "Back to stay"}
      </Link>

      {step === "details" ? (
        <>
          <SectionCard title="Guest details" description="Who's staying and how we reach you.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="co-name">
                <TextInput id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Email" htmlFor="co-email">
                <TextInput id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone (optional)" htmlFor="co-phone">
                <TextInput id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 …" />
              </Field>
            </div>
            <Field label="Message to host (optional)" hint="Arrival time, special requests, etc.">
              <CountedTextArea value={message} onChange={setMessage} max={500} placeholder="Add any details that help…" />
            </Field>
          </SectionCard>

          <SectionCard title="Confirm & agree">
            <CheckRow
              checked={acceptAll}
              onChange={setAcceptAll}
              label="I accept the house rules, cancellation policy, booking terms and data-sharing notice."
            />
          </SectionCard>

          {notReady && (
            <div className="rounded-xl border border-[#EEF3FB] bg-[#F7F9FC] px-4 py-4 text-center">
              <ShieldCheck className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-[13.5px] font-semibold text-[#0B1B3F]">Not bookable online yet</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-slate-500">{notReady}</p>
            </div>
          )}

          <SectionCard title="What happens next">
            <ol className="flex flex-col gap-3">
              {[
                "We hold your dates and recompute the price securely on our server.",
                "You pay by card, Google Pay or Apple Pay — funds are authorised and held in escrow.",
                "The booking confirms on successful payment; the host is paid after check-out.",
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF5FF] text-[12px] font-bold text-[#2563EB]">{i + 1}</span>
                  <span className="min-w-0 break-words pt-0.5 text-[13px] text-slate-600">{t}</span>
                </li>
              ))}
            </ol>
          </SectionCard>

          <PrimaryButton onClick={reserve} disabled={reserving}>
            {reserving ? "Holding your dates…" : <>Reserve &amp; continue to payment <ArrowRight className="h-4 w-4" /></>}
          </PrimaryButton>
        </>
      ) : (
        <>
          <SectionCard title="Secure escrow payment" description="Your card is authorised now and held in escrow — captured only when your stay completes.">
            {reservationId && (
              <PaymentForm
                bookingRef={reservationId}
                amountPence={totalPence}
                currency={currency}
                onResult={onPaid}
              />
            )}
          </SectionCard>
          <GhostButton onClick={() => setStep("details")}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to details
          </GhostButton>
        </>
      )}

      {toast.node}
    </CheckoutShell>
  )
}

function fmtDate(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-[#0B1B3F]">{value}</span>
    </div>
  )
}
