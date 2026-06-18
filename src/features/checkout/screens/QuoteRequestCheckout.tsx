"use client"

// ============================================================================
// Quote request / RFQ checkout body. NO payment is taken.
// Outcome: create a supplier quote request (RFQ record) + supplier notification
// hook + confirmation (all modelled).
// ============================================================================

import { useState } from "react"
import {
  ShieldCheck,
  MapPin,
  CalendarDays,
  Send,
  CheckCircle2,
  BadgeCheck,
  Star,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useCheckoutBundle } from "../data/useCheckoutBundle"
import { CheckoutShell, CheckoutLoading, CheckoutError } from "../components/CheckoutShell"
import { OrderSummaryCard } from "../components/OrderSummaryCard"
import { PhotoUpload } from "../components/PhotoUpload"
import {
  SectionCard,
  Field,
  TextInput,
  SelectInput,
  CountedTextArea,
  ConfirmModal,
  PrimaryButton,
  useToast,
} from "../components/primitives"
import type { SiteVisit, Urgency } from "../data/types"

const TRUST_BADGES = ["ID verified", "Insurance verified", "Background checked", "Quality assured"]

const NEXT_STEPS = [
  "We send your request to the supplier",
  "The supplier reviews your requirements",
  "You receive a tailored quote",
  "Discuss details or book a site visit",
  "Accept the quote to start the work",
]

export function QuoteRequestCheckout({
  quoteRequestId,
  embedded = false,
}: {
  quoteRequestId: string
  embedded?: boolean
}) {
  const { data, loading, error, reload, source } = useCheckoutBundle("quote_request", quoteRequestId)
  const [serviceDesc, setServiceDesc] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("Morning")
  const [urgency, setUrgency] = useState<Urgency>("flexible")
  const [siteVisit, setSiteVisit] = useState<SiteVisit>("none")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [message, setMessage] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const toast = useToast()

  if (loading) return <CheckoutLoading />
  if (error && !data) return <CheckoutError message={error} onRetry={reload} />
  if (!data || !data.quoteRequest) return <CheckoutError message="Quote request not found." onRetry={reload} />

  const rfq = data.quoteRequest
  const sup = data.supplier
  const bd = data.breakdown
  const c = bd.currency

  function sendRequest() {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setConfirmOpen(false)
      setSent(true)
      // (modelled) create RFQ record + supplier notification hook + confirmation + audit
      toast.show("Quote request sent to supplier", "ok")
    }, 800)
  }

  const summary = (
    <OrderSummaryCard type="quote_request" breakdown={bd} heading={rfq.supplier_name ?? "Supplier"} subheading={rfq.service_type ?? undefined} />
  )

  if (sent) {
    return (
      <CheckoutShell step="review" title="Request sent" summary={summary} embedded={embedded}>
        <SectionCard title="Your quote request is on its way">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
            <div>
              <p className="text-[14px] font-semibold text-[#0B1B3F]">{rfq.supplier_name}</p>
              <p className="text-[13px] text-slate-500">{rfq.service_type}</p>
              <p className="mt-2 text-[13px] text-slate-600">No payment was taken. {rfq.supplier_name} will review your requirements and send a tailored quote to {contactEmail || "your email"}.</p>
            </div>
          </div>
        </SectionCard>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step="details" title="Request a quote" subtitle={source === "seed" ? "Preview request" : "No payment taken"} summary={summary} embedded={embedded}>
      {/* Supplier summary */}
      <SectionCard title="Supplier">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[#2563EB]"><ShieldCheck className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-[#0B1B3F]">{rfq.supplier_name}</p>
            {sup?.rating ? <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {sup.rating} · {sup.reviews_count} reviews</p> : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRUST_BADGES.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><BadgeCheck className="h-3 w-3" /> {b}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Requirements */}
      <SectionCard title="Service requirements">
        <div className="flex flex-col gap-3">
          <Field label="Service type"><TextInput defaultValue={rfq.service_type ?? ""} placeholder="e.g. Bathroom renovation" /></Field>
          <Field label="Description"><CountedTextArea value={serviceDesc} onChange={setServiceDesc} max={800} placeholder={rfq.service_description ?? "Describe what you need…"} /></Field>
        </div>
      </SectionCard>

      {/* Property */}
      <SectionCard title="Property address">
        <p className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0B1B3F]"><MapPin className="h-4 w-4 text-slate-400" /> {rfq.property_address}</p>
      </SectionCard>

      {/* Preferred dates + urgency */}
      <SectionCard title="Timing">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Preferred date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Preferred time">
            <SelectInput value={time} onChange={(e) => setTime(e.target.value)}>
              <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Flexible</option>
            </SelectInput>
          </Field>
          <Field label="Urgency">
            <SelectInput value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
              <option value="flexible">Flexible</option><option value="soon">Soon</option><option value="urgent">Urgent</option>
            </SelectInput>
          </Field>
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-slate-400"><CalendarDays className="h-3.5 w-3.5" /> Budget range: {bd.estimate_low_pence != null && bd.estimate_high_pence != null ? <>{formatPence(bd.estimate_low_pence, c)} – {formatPence(bd.estimate_high_pence, c)}</> : "To be confirmed"}</p>
      </SectionCard>

      {/* Attachments */}
      <SectionCard title="Attachments" description="Add reference photos (optional, max 5).">
        <PhotoUpload max={5} />
      </SectionCard>

      {/* Contact + message + site visit */}
      <SectionCard title="Your details & message">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Name"><TextInput value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
          <Field label="Email"><TextInput type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></Field>
          <Field label="Phone"><TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></Field>
        </div>
        <div className="mt-3">
          <Field label="Message to supplier"><CountedTextArea value={message} onChange={setMessage} max={800} placeholder="Any extra context…" /></Field>
        </div>
        <div className="mt-3">
          <Field label="Site visit preference">
            <SelectInput value={siteVisit} onChange={(e) => setSiteVisit(e.target.value as SiteVisit)}>
              <option value="none">No site visit needed</option><option value="virtual">Virtual walkthrough</option><option value="on_site">On-site visit</option>
            </SelectInput>
          </Field>
        </div>
      </SectionCard>

      {/* What happens next */}
      <SectionCard title="What happens next">
        <ol className="flex flex-col gap-2">
          {NEXT_STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 text-[13px] text-slate-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF5FF] text-[11px] font-bold text-[#2563EB]">{i + 1}</span> {s}
            </li>
          ))}
        </ol>
      </SectionCard>

      <PrimaryButton onClick={() => setConfirmOpen(true)}>
        <Send className="h-4 w-4" /> Send quote request
      </PrimaryButton>

      <ConfirmModal
        open={confirmOpen}
        title="Send your quote request?"
        body={<>No payment is taken. We’ll send your requirements to <strong>{rfq.supplier_name}</strong>, who will review and reply with a tailored quote.</>}
        confirmLabel="Send request"
        loading={sending}
        onConfirm={sendRequest}
        onCancel={() => setConfirmOpen(false)}
      />
      {toast.node}
    </CheckoutShell>
  )
}
