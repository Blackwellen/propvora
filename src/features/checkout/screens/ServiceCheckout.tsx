"use client"

// ============================================================================
// Instant-pay service checkout body. Behaviour: payment is HELD in escrow;
// supplier is paid only after completion/sign-off + evidence (modelled).
// No live Stripe call.
// ============================================================================

import { useMemo, useState } from "react"
import {
  CalendarClock,
  MapPin,
  Star,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { calcService } from "../data/calc"
import { useCheckoutBundle } from "../data/useCheckoutBundle"
import { CheckoutShell, CheckoutLoading, CheckoutError, type CheckoutStep } from "../components/CheckoutShell"
import { OrderSummaryCard } from "../components/OrderSummaryCard"
import { PhotoUpload } from "../components/PhotoUpload"
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
  useToast,
} from "../components/primitives"

export function ServiceCheckout({
  serviceOrderId,
  embedded = false,
}: {
  serviceOrderId: string
  embedded?: boolean
}) {
  const { data, loading, error, reload, source } = useCheckoutBundle("service", serviceOrderId)
  const [step, setStep] = useState<CheckoutStep>("details")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [access, setAccess] = useState("")
  const [notes, setNotes] = useState("")
  const [addOns, setAddOns] = useState<Record<string, boolean>>({})
  const [apptConfirmed, setApptConfirmed] = useState(false)
  const [methodId, setMethodId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [booked, setBooked] = useState(false)
  const toast = useToast()

  const liveBreakdown = useMemo(() => {
    if (!data) return null
    const base = data.lineItems.find((l) => l.kind === "base")?.amount_pence ?? data.breakdown.subtotal_pence
    const addOnsPence = data.addOns.reduce((s, a) => (addOns[a.id] ? s + a.amount_pence : s), 0)
    const calc = calcService({ basePence: base, addOnsPence, escrowHoldPence: base + addOnsPence, vatRateBps: data.breakdown.vat_rate_bps })
    return {
      ...data.breakdown,
      subtotal_pence: calc.subtotalPence,
      platform_fee_pence: calc.platformFeePence,
      vat_pence: calc.vatPence,
      deposit_hold_pence: calc.escrowHoldPence,
      total_due_now_pence: calc.totalDueNowPence,
      total_full_pence: calc.totalDueNowPence,
    }
  }, [data, addOns])

  if (loading) return <CheckoutLoading />
  if (error && !data) return <CheckoutError message={error} onRetry={reload} />
  if (!data || !liveBreakdown || !data.service) return <CheckoutError message="Service order not found." onRetry={reload} />

  const svc = data.service
  const sup = data.supplier
  const c = liveBreakdown.currency
  const apptLabel = svc.appointment_at ? new Date(svc.appointment_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not set"

  function payAndBook() {
    setPaying(true)
    setTimeout(() => {
      setPaying(false)
      setConfirmOpen(false)
      setBooked(true)
      // (modelled) hold funds in escrow + create order + supplier notification + audit event
      toast.show("Service booked — payment held in escrow", "ok")
    }, 900)
  }

  const summary = (
    <OrderSummaryCard type="service" breakdown={liveBreakdown} heading={svc.service_name ?? "Service"} subheading={svc.supplier_name ?? undefined} />
  )

  if (booked) {
    return (
      <CheckoutShell step="review" title="Service booked" summary={summary} embedded={embedded}>
        <SectionCard title="Your booking is confirmed">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
            <div>
              <p className="text-[14px] font-semibold text-[#0B1B3F]">{svc.service_name}</p>
              <p className="text-[13px] text-slate-500">{svc.supplier_name} · {apptLabel}</p>
              <p className="mt-2 text-[13px] text-slate-600">
                {formatPence(liveBreakdown.total_due_now_pence, c)} is held in escrow and released to the supplier once the work is completed and signed off.
              </p>
            </div>
          </div>
        </SectionCard>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step={step} title="Book your service" subtitle={source === "seed" ? "Preview order" : undefined} summary={summary} embedded={embedded}>
      {/* Supplier summary */}
      <SectionCard title="Supplier & service" action={<GhostButton onClick={() => toast.show("Change date/time opens the scheduler", "ok")}><CalendarClock className="h-3.5 w-3.5" /> Change date/time</GhostButton>}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EFF5FF] text-[var(--brand)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">{svc.supplier_name}</p>
              {sup?.vetted ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><ShieldCheck className="h-3 w-3" /> Vetted</span> : null}
            </div>
            {sup?.rating ? <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-slate-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {sup.rating} · {sup.reviews_count} reviews</p> : null}
            <p className="mt-1.5 text-[13px] text-slate-600">{svc.service_scope}</p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700"><CalendarClock className="h-3.5 w-3.5 text-slate-400" /> {apptLabel}</p>
          </div>
        </div>
      </SectionCard>

      {/* Property + access */}
      <SectionCard title="Property & access" action={<GhostButton onClick={() => toast.show("Change address", "ok")}><MapPin className="h-3.5 w-3.5" /> Change address</GhostButton>}>
        <p className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0B1B3F]"><MapPin className="h-4 w-4 text-slate-400" /> {svc.property_address}</p>
        <div className="mt-3">
          <Field label="Access details" hint="How will the provider get in?">
            <div className="flex items-start gap-2">
              <KeyRound className="mt-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <TextInput value={access} onChange={(e) => setAccess(e.target.value)} placeholder={svc.access_details ?? "Key safe code, concierge, etc."} />
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Contact + notes */}
      <SectionCard title="Contact & instructions">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="On-site contact name"><TextInput value={contactName} onChange={(e) => setContactName(e.target.value)} /></Field>
          <Field label="Contact phone"><TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+44 …" /></Field>
        </div>
        <div className="mt-3">
          <Field label="Service notes / instructions"><CountedTextArea value={notes} onChange={setNotes} max={500} placeholder="Anything the provider should know…" /></Field>
        </div>
      </SectionCard>

      {/* Add-ons */}
      {data.addOns.length ? (
        <SectionCard title="Add-ons">
          <div className="flex flex-col gap-2">
            {data.addOns.map((a) => (
              <CheckRow key={a.id} checked={!!addOns[a.id]} onChange={(v) => setAddOns((s) => ({ ...s, [a.id]: v }))} label={a.label} pricePence={a.amount_pence} currency={c} />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Photos */}
      <SectionCard title="Photos" description="Help the provider prepare (optional, max 5).">
        <PhotoUpload max={5} />
      </SectionCard>

      {/* Escrow explainer */}
      <SectionCard title="Escrow protection">
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {["Pay", "Held in escrow", "Work completed", "Released to provider"].map((s, i) => (
            <li key={s} className="flex items-center gap-2 text-[12.5px] font-medium text-slate-600">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF5FF] text-[11px] font-bold text-[var(--brand)]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-slate-500"><Lock className="h-3.5 w-3.5 text-emerald-600" /> Your money is protected until the job is done.</p>
      </SectionCard>

      {/* Appointment confirm */}
      <SectionCard title="Confirm appointment">
        <CheckRow checked={apptConfirmed} onChange={setApptConfirmed} label={`I confirm the appointment for ${apptLabel}`} />
      </SectionCard>

      {/* Payment */}
      <SectionCard title="Payment method">
        <PaymentMethodPicker methods={data.paymentMethods} selectedId={methodId} onSelect={(id) => { setMethodId(id); setStep("payment") }} />
      </SectionCard>

      <PrimaryButton onClick={() => { setStep("review"); setConfirmOpen(true) }} disabled={!methodId || !apptConfirmed}>
        Pay {formatPence(liveBreakdown.total_due_now_pence, c)} & book service
      </PrimaryButton>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm & pay"
        body={<>You’ll pay <strong>{formatPence(liveBreakdown.total_due_now_pence, c)}</strong>, held securely in escrow and released to {svc.supplier_name} only after the work is completed and signed off.</>}
        confirmLabel="Pay & book"
        loading={paying}
        onConfirm={payAndBook}
        onCancel={() => setConfirmOpen(false)}
      />
      {toast.node}
    </CheckoutShell>
  )
}
