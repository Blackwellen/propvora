"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  ListChecks,
  FileText,
  CheckCircle2,
  CalendarClock,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { CustomerWizardShell, type WizardStepDef } from "./CustomerWizardShell"
import { customerInputClass, customerTextareaClass } from "./ui"
import { submitChangeRequestAction, type ChangeRequestResult } from "@/app/(customer)/customer/bookings/[id]/modify/actions"

const STEPS: WizardStepDef[] = [
  { num: 1, label: "Type", subtitle: "What to change", icon: ListChecks },
  { num: 2, label: "Details", subtitle: "Your request", icon: FileText },
  { num: 3, label: "Review", subtitle: "Confirm & send", icon: CheckCircle2 },
]

const TYPES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "change_dates", label: "Change dates", icon: CalendarClock },
  { key: "change_guests", label: "Change guest count", icon: Users },
  { key: "cancellation", label: "Request cancellation", icon: XCircle },
  { key: "other", label: "Something else", icon: FileText },
]

export default function ChangeRequestWizard({
  bookingId,
  bookingTitle,
  currentCheckIn,
  currentCheckOut,
  currentGuests,
}: {
  bookingId: string
  bookingTitle: string
  currentCheckIn: string | null
  currentCheckOut: string | null
  currentGuests: number | null
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [type, setType] = useState("")
  const [checkIn, setCheckIn] = useState(currentCheckIn ?? "")
  const [checkOut, setCheckOut] = useState(currentCheckOut ?? "")
  const [guests, setGuests] = useState(currentGuests != null ? String(currentGuests) : "")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isDates = type === "change_dates"
  const isGuests = type === "change_guests"
  const canContinue =
    step === 1 ? !!type : step === 2 ? note.trim().length > 2 || isDates || isGuests : true

  async function submit() {
    setSubmitting(true)
    setError(null)
    const res: ChangeRequestResult = await submitChangeRequestAction(bookingId, {
      type,
      check_in: isDates ? checkIn : undefined,
      check_out: isDates ? checkOut : undefined,
      guests: isGuests ? guests : undefined,
      note,
    })
    if (res.ok) {
      setDone(true)
      router.refresh()
      setTimeout(() => router.push(`/user/bookings/${bookingId}`), 1400)
    } else {
      setError(res.error ?? "Could not send your request.")
      setSubmitting(false)
    }
  }

  function next() {
    if (step < STEPS.length) setStep((s) => s + 1)
    else submit()
  }

  if (done) {
    return (
      <CustomerWizardShell
        steps={STEPS}
        current={3}
        onStep={setStep}
        onPrev={() => {}}
        onNext={() => {}}
        closeHref={`/user/bookings/${bookingId}`}
        title="Request a change"
        subtitle={bookingTitle}
        isLastStep
        canContinue={false}
      >
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Request sent</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Your host has received your request as a message. They&apos;ll confirm any changes and pricing with you directly.
          </p>
        </div>
      </CustomerWizardShell>
    )
  }

  return (
    <CustomerWizardShell
      steps={STEPS}
      current={step}
      onStep={setStep}
      onPrev={() => setStep((s) => Math.max(1, s - 1))}
      onNext={next}
      closeHref={`/user/bookings/${bookingId}`}
      title="Request a change"
      subtitle={bookingTitle}
      isLastStep={step === STEPS.length}
      canContinue={canContinue}
      submitLabel="Send request"
      submitting={submitting}
    >
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">What would you like to change?</h2>
          <p className="mt-1 text-sm text-slate-500">Your host will confirm any change and adjust pricing if needed.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {TYPES.map((t) => {
              const Icon = t.icon
              const active = type === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all ${
                    active ? "border-[var(--brand)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]/20" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${active ? "bg-[var(--brand)] text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-800">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your request</h2>
          <p className="mt-1 text-sm text-slate-500">Give the host what they need to action it.</p>
          <div className="mt-5 space-y-4">
            {isDates && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ci" className="block text-[13px] font-semibold text-slate-700 mb-1">New check-in</label>
                  <input id="ci" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={customerInputClass} />
                </div>
                <div>
                  <label htmlFor="co" className="block text-[13px] font-semibold text-slate-700 mb-1">New check-out</label>
                  <input id="co" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={customerInputClass} />
                </div>
              </div>
            )}
            {isGuests && (
              <div>
                <label htmlFor="g" className="block text-[13px] font-semibold text-slate-700 mb-1">New guest count</label>
                <input id="g" type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} className={customerInputClass} />
              </div>
            )}
            <div>
              <label htmlFor="note" className="block text-[13px] font-semibold text-slate-700 mb-1">
                Note to host {!isDates && !isGuests && <span className="text-red-500">*</span>}
              </label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Add any detail that helps the host action your request." className={customerTextareaClass} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900">Review your request</h2>
          <p className="mt-1 text-sm text-slate-500">We&apos;ll send this to your host as a message on this booking.</p>
          <dl className="mt-5 space-y-3 rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Stay</dt><dd className="text-sm font-medium text-slate-800 text-right">{bookingTitle}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">Request</dt><dd className="text-sm font-medium text-slate-800 text-right capitalize">{type.replace(/_/g, " ")}</dd></div>
            {isDates && (
              <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">New dates</dt><dd className="text-sm font-medium text-slate-800 text-right">{checkIn || "—"} → {checkOut || "—"}</dd></div>
            )}
            {isGuests && (
              <div className="flex justify-between gap-3"><dt className="text-sm text-slate-500">New guests</dt><dd className="text-sm font-medium text-slate-800 text-right">{guests || "—"}</dd></div>
            )}
            {note && <div><dt className="text-sm text-slate-500 mb-1">Note</dt><dd className="text-sm text-slate-700 whitespace-pre-line">{note}</dd></div>}
          </dl>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-400">
            <CalendarCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Sending a request doesn&apos;t change your booking automatically — the host confirms any change with you first.
          </p>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </div>
      )}
    </CustomerWizardShell>
  )
}
