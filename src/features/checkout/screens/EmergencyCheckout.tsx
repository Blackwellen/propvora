"use client"

// ============================================================================
// Emergency service checkout / dispatch body. RED emergency band.
// Behaviour: request is sent on (modelled) payment auth; funds held in escrow;
// provider acceptance-window countdown; on reject/timeout the next provider is
// dispatched. No live Stripe call.
// ============================================================================

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  LifeBuoy,
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
  CountedTextArea,
  PaymentMethodPicker,
  ConfirmModal,
  PrimaryButton,
  useToast,
} from "../components/primitives"
import type { DispatchStage, PreferredContact } from "../data/types"

const DISPATCH_STAGES: { key: DispatchStage; label: string }[] = [
  { key: "request_sent", label: "Request sent" },
  { key: "provider_accepted", label: "Provider accepted" },
  { key: "en_route", label: "En route" },
  { key: "on_site", label: "On site" },
  { key: "completed", label: "Completion" },
]

function Countdown({ deadline }: { deadline: string | null }) {
  const [left, setLeft] = useState<number>(() =>
    deadline ? Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)) : 0
  )
  useEffect(() => {
    if (!deadline) return
    const t = setInterval(() => {
      setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(t)
  }, [deadline])
  const m = Math.floor(left / 60)
  const s = left % 60
  return <span className="tabular-nums">{m}:{s.toString().padStart(2, "0")}</span>
}

const CONTACT_OPTS: { key: PreferredContact; label: string; icon: typeof PhoneCall }[] = [
  { key: "call", label: "Call", icon: PhoneCall },
  { key: "text", label: "Text", icon: MessageSquare },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
]

export function EmergencyCheckout({
  emergencyOrderId,
  embedded = false,
}: {
  emergencyOrderId: string
  embedded?: boolean
}) {
  const { data, loading, error, reload, source } = useCheckoutBundle("emergency", emergencyOrderId)
  const [issue, setIssue] = useState("")
  const [accessNotes, setAccessNotes] = useState("")
  const [contactMethod, setContactMethod] = useState<PreferredContact>("call")
  const [methodId, setMethodId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const [dispatched, setDispatched] = useState(false)
  const toast = useToast()

  const breakdown = useMemo(() => data?.breakdown ?? null, [data])

  if (loading) return <CheckoutLoading />
  if (error && !data) return <CheckoutError message={error} onRetry={reload} />
  if (!data || !breakdown || !data.emergency) return <CheckoutError message="Emergency request not found." onRetry={reload} />

  const em = data.emergency
  const c = breakdown.currency

  function dispatchNow() {
    setPaying(true)
    setTimeout(() => {
      setPaying(false)
      setConfirmOpen(false)
      setDispatched(true)
      // (modelled) auth payment → hold in escrow → send dispatch request → start countdown → audit
      toast.show("Dispatch request sent — finding nearest provider", "ok")
    }, 900)
  }

  const summary = (
    <OrderSummaryCard type="emergency" breakdown={breakdown} heading={em.provider_name ?? "Emergency provider"} subheading={em.coverage_area ?? undefined} />
  )

  if (dispatched) {
    return (
      <CheckoutShell step="review" title="Dispatch in progress" summary={summary} embedded={embedded}>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-red-700"><AlertTriangle className="h-5 w-5" /> Emergency dispatch active</p>
          <p className="mt-1 text-[12.5px] text-red-600">Awaiting provider acceptance — window closes in <strong><Countdown deadline={em.acceptance_deadline} /></strong>. If it lapses we’ll dispatch the next available provider automatically.</p>
        </div>
        <SectionCard title="Dispatch progress">
          <ol className="flex flex-col gap-3">
            {DISPATCH_STAGES.map((s, i) => {
              const reached = i === 0
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${reached ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-400"}`}>{reached ? <CheckCircle2 className="h-4 w-4" /> : i + 1}</span>
                  <span className={`text-[13px] font-medium ${reached ? "text-[#0B1B3F]" : "text-slate-400"}`}>{s.label}</span>
                </li>
              )
            })}
          </ol>
        </SectionCard>
        <div className="flex gap-3">
          <button type="button" onClick={() => toast.show("Connecting to support…", "ok")} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D8E1F0] bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><LifeBuoy className="h-4 w-4" /> Call support</button>
          <a href="/checkout" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D8E1F0] bg-white text-[13px] font-semibold text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /> Back to bookings</a>
        </div>
        {toast.node}
      </CheckoutShell>
    )
  }

  return (
    <CheckoutShell step="details" title="Emergency dispatch" subtitle={source === "seed" ? "Preview request" : undefined} summary={summary} embedded={embedded}>
      {/* RED emergency band */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-600 to-red-500 px-5 py-4 text-white shadow-sm">
        <p className="flex items-center gap-2 text-[15px] font-bold"><AlertTriangle className="h-5 w-5" /> Emergency service request</p>
        <p className="mt-1 text-[12.5px] text-red-50">We’ll dispatch the nearest available provider. Funds are held in escrow until the job is done.</p>
        {em.live_phone ? (
          <a href={`tel:${em.live_phone.replace(/\s/g, "")}`} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-[13px] font-semibold backdrop-blur hover:bg-white/25">
            <Phone className="h-4 w-4" /> Emergency line: {em.live_phone}
          </a>
        ) : null}
      </div>

      {/* Provider card */}
      <SectionCard title="Assigned provider">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldCheck className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-[#0B1B3F]">{em.provider_name}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"><ShieldCheck className="h-3 w-3" /> Verified pro · Vetted & insured</span>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-slate-600"><Clock className="h-3.5 w-3.5 text-slate-400" /> Response time {em.response_time_label} · {em.coverage_area}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[12.5px] font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" /> Acceptance window: <Countdown deadline={em.acceptance_deadline} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Property + issue */}
      <SectionCard title="Property & issue">
        <p className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0B1B3F]"><MapPin className="h-4 w-4 text-slate-400" /> {em.property_address}</p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Describe the issue"><CountedTextArea value={issue} onChange={setIssue} max={500} placeholder={em.issue_details ?? "What’s happening?"} /></Field>
          <Field label="Access / additional notes"><TextInput value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} placeholder="Gate code, parking, hazards…" /></Field>
        </div>
      </SectionCard>

      {/* Photos */}
      <SectionCard title="Photos" description="Show the problem so the provider arrives prepared (max 5).">
        <PhotoUpload max={5} />
      </SectionCard>

      {/* Preferred contact */}
      <SectionCard title="Preferred contact method">
        <div className="grid grid-cols-3 gap-2">
          {CONTACT_OPTS.map((o) => {
            const active = contactMethod === o.key
            return (
              <button key={o.key} type="button" onClick={() => setContactMethod(o.key)} className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[12.5px] font-semibold transition-colors ${active ? "border-[#2563EB] bg-[#EFF5FF] text-[#2563EB]" : "border-[#E2EAF6] bg-white text-slate-600 hover:border-[#CBD8EE]"}`}>
                <o.icon className="h-4 w-4" /> {o.label}
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* Payment */}
      <SectionCard title="Escrow-protected payment">
        <PaymentMethodPicker methods={data.paymentMethods} selectedId={methodId} onSelect={setMethodId} />
        <p className="mt-3 text-[12px] text-slate-500">
          Estimated total {breakdown.estimate_low_pence != null && breakdown.estimate_high_pence != null ? <>{formatPence(breakdown.estimate_low_pence, c)} – {formatPence(breakdown.estimate_high_pence, c)}</> : formatPence(breakdown.total_due_now_pence, c)} incl. VAT. The call-out fee is authorised now; the final amount is confirmed after the job. Refund policy applies if no provider accepts.
        </p>
      </SectionCard>

      <PrimaryButton tone="danger" onClick={() => setConfirmOpen(true)} disabled={!methodId}>
        <AlertTriangle className="h-4 w-4" /> Pay & dispatch now
      </PrimaryButton>

      <ConfirmModal
        open={confirmOpen}
        title="Dispatch emergency provider?"
        tone="danger"
        body={<>We’ll authorise your call-out fee and immediately request the nearest provider. Funds are held in escrow. If no one accepts within the window we’ll try the next provider or refund you.</>}
        confirmLabel="Pay & dispatch"
        loading={paying}
        onConfirm={dispatchNow}
        onCancel={() => setConfirmOpen(false)}
      />
      {toast.node}
    </CheckoutShell>
  )
}
