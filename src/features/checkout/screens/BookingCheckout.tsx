"use client"

// ============================================================================
// Booking checkout body — steps Details / Payment / Review.
// Behaviour: booking is confirmed ONLY after (modelled) payment success; we
// then create the booking record + fire confirmation email hook + audit event.
// No live Stripe call — payment lifecycle is modelled in component state.
// ============================================================================

import { useMemo, useState } from "react"
import {
  CalendarDays,
  Users,
  Tag,
  Pencil,
  MapPin,
  Star,
  CheckCircle2,
  Save,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { calcBooking } from "../data/calc"
import { useCheckoutBundle } from "../data/useCheckoutBundle"
import { CheckoutShell, CheckoutLoading, CheckoutError, type CheckoutStep } from "../components/CheckoutShell"
import { OrderSummaryCard } from "../components/OrderSummaryCard"
import {
  SectionCard,
  Field,
  TextInput,
  CheckRow,
  CountedTextArea,
  Toggle,
  PaymentMethodPicker,
  ConfirmModal,
  PrimaryButton,
  GhostButton,
  useToast,
} from "../components/primitives"

export function BookingCheckout({
  bookingId,
  embedded = false,
  isAuthed = false,
}: {
  bookingId: string
  embedded?: boolean
  isAuthed?: boolean
}) {
  const { data, loading, error, reload, source } = useCheckoutBundle("booking", bookingId)
  const [step, setStep] = useState<CheckoutStep>("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [billingSame, setBillingSame] = useState(true)
  const [billingLine1, setBillingLine1] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingPostcode, setBillingPostcode] = useState("")
  const [arrival, setArrival] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [promo, setPromo] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pence: number } | null>(null)
  const [extras, setExtras] = useState<Record<string, boolean>>({})
  const [methodId, setMethodId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const toast = useToast()

  const liveBreakdown = useMemo(() => {
    if (!data) return null
    const prop = data.property
    const extrasPence = data.addOns.reduce((sum, a) => (extras[a.id] ? sum + a.amount_pence : sum), 0)
    const calc = calcBooking({
      nightlyPence: prop?.nightly_pence ?? 0,
      nights: prop?.nights ?? 0,
      cleaningFeePence: data.breakdown.cleaning_fee_pence,
      extrasPence,
      discountPence: appliedPromo?.pence ?? 0,
      depositHoldPence: data.breakdown.deposit_hold_pence,
      vatRateBps: data.breakdown.vat_rate_bps,
    })
    return {
      ...data.breakdown,
      subtotal_pence: calc.subtotalPence,
      service_fee_pence: calc.serviceFeePence,
      discount_pence: calc.discountPence,
      vat_pence: calc.vatPence,
      total_due_now_pence: calc.totalDueNowPence,
      total_full_pence: calc.totalFullPence,
      promo_code: appliedPromo?.code ?? null,
    }
  }, [data, extras, appliedPromo])

  if (loading) return <CheckoutLoading />
  if (error && !data) return <CheckoutError message={error} onRetry={reload} />
  if (!data || !liveBreakdown) return <CheckoutError message="Booking not found." onRetry={reload} />

  const prop = data.property!
  const guest = data.guest!
  const c = liveBreakdown.currency

  function applyPromo() {
    const code = promo.trim().toUpperCase()
    if (!code) return
    // Modelled: WELCOME10 = 10% of subtotal, anything else = flat £15 off.
    const subtotal = liveBreakdown!.subtotal_pence
    const pence = code === "WELCOME10" ? Math.round(subtotal * 0.1) : 1500
    setAppliedPromo({ code, pence })
    toast.show(`Promo ${code} applied`, "ok")
  }

  function payAndConfirm() {
    setPaying(true)
    // Model the payment → success → confirm sequence (NO Stripe call).
    setTimeout(() => {
      setPaying(false)
      setConfirmOpen(false)
      setConfirmed(true)
      // (modelled) create booking record + confirmation email hook + audit event
      toast.show("Booking confirmed — confirmation email sent", "ok")
    }, 900)
  }

  const summary = (
    <OrderSummaryCard
      type="booking"
      breakdown={liveBreakdown}
      thumbUrl={prop.image_url}
      heading={prop.property_name}
      subheading={prop.location}
    />
  )

  if (confirmed) {
    return (
      <CheckoutShell step="review" title="Booking confirmed" summary={summary} embedded={embedded}>
        <SectionCard title="You’re all set">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
            <div>
              <p className="text-[14px] font-semibold text-[#0B1B3F]">{prop.property_name}</p>
              <p className="text-[13px] text-slate-500">
                {guest.check_in} → {guest.check_out} · {guest.guests_count} guests
              </p>
              <p className="mt-2 text-[13px] text-slate-600">
                A confirmation has been sent to {email || "your email"}. Your card was charged{" "}
                {formatPence(liveBreakdown.total_due_now_pence, c)}.
              </p>
            </div>
          </div>
        </SectionCard>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell
      step={step}
      title="Complete your booking"
      subtitle={source === "seed" ? "Preview booking" : undefined}
      summary={summary}
      embedded={embedded}
    >
      {/* Property summary */}
      <SectionCard
        title="Your stay"
        action={<GhostButton onClick={() => toast.show("Edit dates opens the calendar", "ok")}><Pencil className="h-3.5 w-3.5" /> Edit dates</GhostButton>}
      >
        <div className="flex gap-4">
          {prop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={prop.image_url} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2563EB]">
              <MapPin className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[#0B1B3F]">{prop.property_name}</p>
            <p className="text-[12.5px] text-slate-500">{prop.location}</p>
            {prop.rating ? (
              <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {prop.rating} · {prop.reviews_count} reviews
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-slate-600">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {guest.check_in} → {guest.check_out} ({prop.nights} nights)</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-slate-400" /> {guest.guests_count} guests</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Guest / contact details */}
      <SectionCard title="Guest & contact details">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Full name" htmlFor="bk-name"><TextInput id="bk-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></Field>
          <Field label="Email" htmlFor="bk-email"><TextInput id="bk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" /></Field>
          <Field label="Phone" htmlFor="bk-phone"><TextInput id="bk-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 …" /></Field>
        </div>
      </SectionCard>

      {/* Billing address */}
      <SectionCard title="Billing address" action={<Toggle checked={billingSame} onChange={setBillingSame} label="Same as contact" />}>
        {billingSame ? (
          <p className="text-[13px] text-slate-500">Billing address matches your contact details.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Address line 1" htmlFor="bk-l1"><TextInput id="bk-l1" value={billingLine1} onChange={(e) => setBillingLine1(e.target.value)} /></Field>
            <Field label="City" htmlFor="bk-city"><TextInput id="bk-city" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} /></Field>
            <Field label="Postcode" htmlFor="bk-pc"><TextInput id="bk-pc" value={billingPostcode} onChange={(e) => setBillingPostcode(e.target.value)} /></Field>
          </div>
        )}
      </SectionCard>

      {/* Optional extras */}
      {data.addOns.length ? (
        <SectionCard title="Optional extras">
          <div className="flex flex-col gap-2">
            {data.addOns.map((a) => (
              <CheckRow key={a.id} checked={!!extras[a.id]} onChange={(v) => setExtras((s) => ({ ...s, [a.id]: v }))} label={a.label} pricePence={a.amount_pence} currency={c} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Arrival + promo + special requests */}
      <SectionCard title="Arrival details & requests">
        <div className="flex flex-col gap-4">
          <Field label="Arrival details" htmlFor="bk-arrival" hint="Estimated arrival time, flight number, etc.">
            <TextInput id="bk-arrival" value={arrival} onChange={(e) => setArrival(e.target.value)} placeholder="Arriving ~3pm" />
          </Field>
          <Field label="Promo code" htmlFor="bk-promo">
            <div className="flex gap-2">
              <TextInput id="bk-promo" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="WELCOME10" />
              <button type="button" onClick={applyPromo} className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-[#D8E1F0] bg-white px-4 text-[13px] font-semibold text-[#2563EB] hover:bg-[#EFF5FF]">
                <Tag className="h-3.5 w-3.5" /> Apply
              </button>
            </div>
            {appliedPromo ? <span className="mt-1 block text-[11.5px] font-medium text-emerald-600">{appliedPromo.code} · −{formatPence(appliedPromo.pence, c)}</span> : null}
          </Field>
          <Field label="Special requests">
            <CountedTextArea value={specialRequests} onChange={setSpecialRequests} max={500} placeholder="Late check-in, cot required, etc." />
          </Field>
        </div>
      </SectionCard>

      {/* Payment */}
      <SectionCard title="Payment method">
        <PaymentMethodPicker methods={data.paymentMethods} selectedId={methodId} onSelect={(id) => { setMethodId(id); setStep("payment") }} />
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <PrimaryButton onClick={() => { setStep("review"); setConfirmOpen(true) }} disabled={!methodId}>
            Pay {formatPence(liveBreakdown.total_due_now_pence, c)} & confirm booking
          </PrimaryButton>
        </div>
        {isAuthed ? (
          <button type="button" onClick={() => toast.show("Draft saved", "ok")} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D8E1F0] bg-white px-5 text-[14px] font-semibold text-slate-600 hover:bg-slate-50">
            <Save className="h-4 w-4" /> Save draft
          </button>
        ) : null}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm your booking"
        body={<>You’ll be charged <strong>{formatPence(liveBreakdown.total_due_now_pence, c)}</strong> now. A refundable deposit of {formatPence(liveBreakdown.deposit_hold_pence, c)} is held separately and released after checkout.</>}
        confirmLabel="Pay & confirm"
        loading={paying}
        onConfirm={payAndConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
      {toast.node}
    </CheckoutShell>
  )
}
