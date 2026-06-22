"use client"

// ============================================================================
// MarketplaceCheckout — premium, self-contained multi-step checkout used by
// every public marketplace flow (stays, services, suppliers, emergency).
//
//   Step 1  Details   — booking details + contact + extras + promo
//   Step 2  Payment   — payment method + card form
//   Step 3  Review    — confirmation screen (post-payment success)
//
// Payment is MODELLED in component state (no live Stripe call). Booking is only
// "confirmed" after the modelled payment succeeds. Reuses the shared checkout
// primitives + CheckoutShell chrome so it matches the authenticated checkout.
// Light tokens only — NEVER `dark:`. All imagery via next/image.
// ============================================================================

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import {
  CheckoutShell,
  type CheckoutStep,
} from "@/features/checkout/components/CheckoutShell"
import {
  SectionCard,
  Field,
  TextInput,
  CheckRow,
  CountedTextArea,
  PaymentMethodPicker,
  ConfirmModal,
  PrimaryButton,
  GhostButton,
  TrustBar,
  SecurityNote,
  useToast,
} from "@/features/checkout/components/primitives"

export type CheckoutKind = "stay" | "service" | "supplier" | "emergency"

export interface CheckoutLineItem {
  label: string
  pence: number
}

export interface CheckoutExtra {
  id: string
  label: string
  pence: number
  description?: string
}

export interface MarketplaceCheckoutConfig {
  kind: CheckoutKind
  /** Page title shown in the checkout chrome. */
  title: string
  /** Order-summary heading (property / service / provider name). */
  heading: string
  subheading?: string
  thumbUrl?: string
  /** Compact key/value rows shown in the order summary (dates, package, etc.). */
  metaRows: { label: string; value: string }[]
  /** Base charge lines (always applied). */
  lineItems: CheckoutLineItem[]
  /** Optional add-ons the buyer can toggle. */
  extras?: CheckoutExtra[]
  /** Refundable deposit held separately (shown, not added to total due now). */
  depositPence?: number
  /** VAT rate in basis points (e.g. 2000 = 20%). Applied to subtotal. */
  vatRateBps?: number
  currency?: string
  /** "What's included" bullets shown on the details step + summary. */
  included?: string[]
  /** Trust signals (verified, insured, rating) shown under the summary. */
  trustChips?: string[]
  /** "Good to know" / cancellation policy lines. */
  policyNotes?: string[]
  /** "What happens next" steps (reassurance timeline on the details step). */
  whatNext?: string[]
  /** Where the "back" link / breadcrumb returns to. */
  backHref: string
  backLabel?: string
  /** Optional "message the provider" link. */
  messageHref?: string
  /** Render inside the app shell (no outer secure-checkout chrome). */
  embedded?: boolean
  /** Where the success screen's primary CTA goes. */
  successHref?: string
  successHrefLabel?: string
}

const KIND_COPY: Record<
  CheckoutKind,
  { title: string; cta: string; detailsTitle: string; detailsDesc: string }
> = {
  stay: {
    title: "Complete your booking",
    cta: "Confirm & pay",
    detailsTitle: "Guest details",
    detailsDesc: "Who's staying and how we reach you.",
  },
  service: {
    title: "Book this service",
    cta: "Confirm & pay",
    detailsTitle: "Where & when",
    detailsDesc: "Tell us where the work is and when suits you.",
  },
  supplier: {
    title: "Book this supplier",
    cta: "Confirm & pay",
    detailsTitle: "Job details",
    detailsDesc: "Describe the job and where it needs doing.",
  },
  emergency: {
    title: "Request emergency call-out",
    cta: "Dispatch & pay",
    detailsTitle: "Where's the emergency?",
    detailsDesc: "We'll dispatch the nearest available pro right away.",
  },
}

function refNumber(kind: CheckoutKind): string {
  const prefix = { stay: "STY", service: "SVC", supplier: "SUP", emergency: "EMG" }[kind]
  const n = Math.floor(100000 + Math.random() * 899999)
  return `${prefix}-${n}`
}

export default function MarketplaceCheckout({ config }: { config: MarketplaceCheckoutConfig }) {
  const toast = useToast()
  const copy = KIND_COPY[config.kind]
  const currency = config.currency ?? "GBP"

  const [step, setStep] = useState<CheckoutStep>("details")

  // Contact
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Booking details
  const [address, setAddress] = useState("")
  const [postcode, setPostcode] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [notes, setNotes] = useState("")

  // Extras + promo
  const [extras, setExtras] = useState<Record<string, boolean>>({})
  const [promo, setPromo] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; pence: number } | null>(null)

  // Payment
  const [methodId, setMethodId] = useState<string | null>("synthetic-card")
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [reference] = useState(() => refNumber(config.kind))

  const needsLocation = config.kind !== "stay"
  const isCard = methodId === "synthetic-card" || methodId?.startsWith("card")

  const totals = useMemo(() => {
    const base = config.lineItems.reduce((s, l) => s + l.pence, 0)
    const extrasPence = (config.extras ?? []).reduce(
      (s, e) => (extras[e.id] ? s + e.pence : s),
      0,
    )
    const discount = appliedPromo?.pence ?? 0
    const subtotal = Math.max(0, base + extrasPence - discount)
    const vat = config.vatRateBps ? Math.round((subtotal * config.vatRateBps) / 10000) : 0
    const total = subtotal + vat
    return { base, extrasPence, discount, subtotal, vat, total }
  }, [config.lineItems, config.extras, config.vatRateBps, extras, appliedPromo])

  function applyPromo() {
    const code = promo.trim().toUpperCase()
    if (!code) return
    const base = config.lineItems.reduce((s, l) => s + l.pence, 0)
    const pence = code === "WELCOME10" ? Math.round(base * 0.1) : 1500
    setAppliedPromo({ code, pence })
    toast.show(`Promo ${code} applied`, "ok")
  }

  function goToPayment() {
    if (!name.trim() || !email.trim()) {
      toast.show("Add your name and email to continue", "err")
      return
    }
    if (needsLocation && !postcode.trim()) {
      toast.show("Add the property postcode to continue", "err")
      return
    }
    setStep("payment")
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function payAndConfirm() {
    setPaying(true)
    // Model payment → success → confirm (NO Stripe call).
    setTimeout(() => {
      setPaying(false)
      setConfirmOpen(false)
      setConfirmed(true)
      setStep("review")
      toast.show("Payment successful — confirmation sent", "ok")
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
    }, 1100)
  }

  // ── Order summary (right rail) ────────────────────────────────────────────
  const summary = (
    <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-sm">
      <div className="flex gap-3 border-b border-[#EEF2F9] p-4">
        {config.thumbUrl ? (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            <Image src={config.thumbUrl} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : (
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2563EB]">
            <MapPin className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-tight text-[#0B1B3F]">{config.heading}</p>
          {config.subheading ? (
            <p className="mt-0.5 text-[12px] text-slate-500">{config.subheading}</p>
          ) : null}
        </div>
      </div>

      {config.metaRows.length > 0 ? (
        <div className="space-y-1.5 border-b border-[#EEF2F9] px-4 py-3">
          {config.metaRows.map((m) => (
            <div key={m.label} className="flex items-start justify-between gap-3 text-[12.5px]">
              <span className="shrink-0 text-slate-500">{m.label}</span>
              <span className="min-w-0 break-words text-right font-medium text-[#0B1B3F]">{m.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2 px-4 py-3 text-[13px]">
        {config.lineItems.map((l) => (
          <div key={l.label} className="flex items-start justify-between gap-3 text-slate-600">
            <span className="min-w-0 break-words">{l.label}</span>
            <span className="shrink-0 font-medium tabular-nums text-[#0B1B3F]">{formatPence(l.pence, currency)}</span>
          </div>
        ))}
        {(config.extras ?? [])
          .filter((e) => extras[e.id])
          .map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-3 text-slate-600">
              <span className="min-w-0 break-words">{e.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-[#0B1B3F]">+ {formatPence(e.pence, currency)}</span>
            </div>
          ))}
        {appliedPromo ? (
          <div className="flex items-center justify-between gap-3 text-emerald-600">
            <span>Promo {appliedPromo.code}</span>
            <span className="font-medium tabular-nums">− {formatPence(appliedPromo.pence, currency)}</span>
          </div>
        ) : null}
        {totals.vat > 0 ? (
          <div className="flex items-center justify-between gap-3 text-slate-600">
            <span>VAT ({((config.vatRateBps ?? 0) / 100).toFixed(0)}%)</span>
            <span className="font-medium tabular-nums text-[#0B1B3F]">{formatPence(totals.vat, currency)}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#EEF2F9] px-4 py-3.5">
        <span className="text-[14px] font-bold text-[#0B1B3F]">Total due now</span>
        <span className="text-[18px] font-extrabold tabular-nums text-[#0B1B3F]">
          {formatPence(totals.total, currency)}
        </span>
      </div>

      {config.depositPence ? (
        <p className="border-t border-[#EEF2F9] px-4 py-2.5 text-[11.5px] text-slate-500">
          A refundable deposit of {formatPence(config.depositPence, currency)} is held separately and
          released after completion.
        </p>
      ) : null}

      {config.included && config.included.length > 0 ? (
        <div className="border-t border-[#EEF2F9] px-4 py-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <Sparkles className="h-3 w-3" /> What's included
          </p>
          <ul className="space-y-1">
            {config.included.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="min-w-0 break-words">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {config.trustChips && config.trustChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-[#EEF2F9] px-4 py-3">
          {config.trustChips.map((chip) => (
            <span key={chip} className="inline-flex items-center gap-1 rounded-full bg-[#F1F6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
              <ShieldCheck className="h-3 w-3" /> {chip}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (confirmed) {
    return (
      <CheckoutShell step="review" title="Booking confirmed" summary={summary} embedded={config.embedded}>
        <SectionCard title="You're all set">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">{config.heading}</p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {config.metaRows.map((m) => m.value).join(" · ")}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
                A confirmation has been sent to{" "}
                <strong className="font-semibold text-[#0B1B3F]">{email || "your email"}</strong>. Your card
                was charged <strong className="font-semibold text-[#0B1B3F]">{formatPence(totals.total, currency)}</strong>.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#F1F6FF] px-3 py-1.5 text-[12.5px] font-semibold text-[#1D4ED8]">
                <Tag className="h-3.5 w-3.5" /> Reference {reference}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={config.successHref ?? config.backHref}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8]"
          >
            {config.successHrefLabel ?? "View my bookings"} <ArrowRight className="h-4 w-4" />
          </Link>
          {config.messageHref ? (
            <Link
              href={config.messageHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#D8E1F0] bg-white px-5 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4" /> Message provider
            </Link>
          ) : null}
        </div>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step={step} title={config.title || copy.title} summary={summary} embedded={config.embedded}>
      {/* Back link */}
      <Link
        href={config.backHref}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-[#1D4ED8]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {config.backLabel ?? "Back"}
      </Link>

      {step === "details" ? (
        <>
          {/* Booking details */}
          <SectionCard title={copy.detailsTitle} description={copy.detailsDesc}>
            <div className="flex flex-col gap-4">
              {needsLocation ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                  <Field label="Property address" htmlFor="co-addr">
                    <TextInput
                      id="co-addr"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="12 Oakfield Road, Flat 2"
                    />
                  </Field>
                  <Field label="Postcode" htmlFor="co-pc">
                    <TextInput
                      id="co-pc"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder="M14 5TP"
                    />
                  </Field>
                </div>
              ) : null}

              {config.kind !== "stay" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Preferred date" htmlFor="co-date">
                    <TextInput
                      id="co-date"
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                    />
                  </Field>
                  <Field label="Preferred time" htmlFor="co-time">
                    <TextInput
                      id="co-time"
                      type="time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                    />
                  </Field>
                </div>
              ) : null}

              <Field
                label={config.kind === "stay" ? "Message to host (optional)" : "Notes for the provider"}
                hint={config.kind === "stay" ? "Arrival time, special requests, etc." : "Access details, parking, what needs doing."}
              >
                <CountedTextArea value={notes} onChange={setNotes} max={500} placeholder="Add any details that help…" />
              </Field>
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard title="Contact details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full name" htmlFor="co-name">
                <TextInput id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </Field>
              <Field label="Email" htmlFor="co-email">
                <TextInput id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone" htmlFor="co-phone">
                <TextInput id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 …" />
              </Field>
            </div>
          </SectionCard>

          {/* Extras */}
          {config.extras && config.extras.length > 0 ? (
            <SectionCard title="Add-ons & extras" description="Optional — toggle anything you'd like to include.">
              <div className="flex flex-col gap-2">
                {config.extras.map((e) => (
                  <CheckRow
                    key={e.id}
                    checked={!!extras[e.id]}
                    onChange={(v) => setExtras((s) => ({ ...s, [e.id]: v }))}
                    label={e.label}
                    pricePence={e.pence}
                    currency={currency}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Promo */}
          <SectionCard title="Promo code">
            <Field label="Have a code?" htmlFor="co-promo">
              <div className="flex gap-2">
                <TextInput id="co-promo" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="WELCOME10" />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-[#D8E1F0] bg-white px-4 text-[13px] font-semibold text-[#2563EB] hover:bg-[#EFF5FF]"
                >
                  <Tag className="h-3.5 w-3.5" /> Apply
                </button>
              </div>
              {appliedPromo ? (
                <span className="mt-1 block text-[11.5px] font-medium text-emerald-600">
                  {appliedPromo.code} · −{formatPence(appliedPromo.pence, currency)}
                </span>
              ) : null}
            </Field>
          </SectionCard>

          {/* What happens next */}
          {config.whatNext && config.whatNext.length > 0 ? (
            <SectionCard title="What happens next">
              <ol className="flex flex-col gap-3">
                {config.whatNext.map((stepText, i) => (
                  <li key={stepText} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF5FF] text-[12px] font-bold text-[#2563EB]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 break-words pt-0.5 text-[13px] text-slate-600">{stepText}</span>
                  </li>
                ))}
              </ol>
            </SectionCard>
          ) : null}

          {/* Good to know */}
          {config.policyNotes && config.policyNotes.length > 0 ? (
            <SectionCard title="Good to know">
              <ul className="flex flex-col gap-2">
                {config.policyNotes.map((note) => (
                  <li key={note} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="min-w-0 break-words">{note}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <PrimaryButton onClick={goToPayment}>
            Continue to payment <ArrowRight className="h-4 w-4" />
          </PrimaryButton>
        </>
      ) : (
        <>
          {/* Payment method */}
          <SectionCard title="Payment method">
            <PaymentMethodPicker methods={[]} selectedId={methodId} onSelect={setMethodId} />
          </SectionCard>

          {/* Card details */}
          {isCard ? (
            <SectionCard title="Card details" description="Your card is tokenised — details are never stored on Propvora.">
              <div className="flex flex-col gap-3">
                <Field label="Name on card" htmlFor="cc-name">
                  <TextInput id="cc-name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Jane Doe" />
                </Field>
                <Field label="Card number" htmlFor="cc-num">
                  <div className="relative">
                    <TextInput
                      id="cc-num"
                      value={cardNumber}
                      inputMode="numeric"
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
                      placeholder="4242 4242 4242 4242"
                      className="pl-10"
                    />
                    <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry" htmlFor="cc-exp">
                    <TextInput id="cc-exp" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))} placeholder="MM/YY" />
                  </Field>
                  <Field label="CVC" htmlFor="cc-cvc">
                    <TextInput id="cc-cvc" value={cardCvc} inputMode="numeric" onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
                  </Field>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Confirm with your wallet">
              <p className="text-[13px] text-slate-600">
                You'll be asked to authorise the payment with your selected wallet when you confirm.
              </p>
            </SectionCard>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <GhostButton onClick={() => setStep("details")}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to details
            </GhostButton>
            <div className="flex-1">
              <PrimaryButton onClick={() => setConfirmOpen(true)}>
                <Lock className="h-4 w-4" /> {copy.cta} {formatPence(totals.total, currency)}
              </PrimaryButton>
            </div>
          </div>

          <div className="lg:hidden">
            <TrustBar />
          </div>
          <div className="lg:hidden">
            <SecurityNote />
          </div>

          <ConfirmModal
            open={confirmOpen}
            title={config.kind === "emergency" ? "Dispatch emergency call-out" : "Confirm & pay"}
            body={
              <>
                You'll be charged <strong>{formatPence(totals.total, currency)}</strong> now.
                {config.depositPence
                  ? ` A refundable deposit of ${formatPence(config.depositPence, currency)} is held separately.`
                  : " You can cancel free of charge within the provider's policy window."}
              </>
            }
            confirmLabel={`Pay ${formatPence(totals.total, currency)}`}
            loading={paying}
            onConfirm={payAndConfirm}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}

      {toast.node}
    </CheckoutShell>
  )
}
