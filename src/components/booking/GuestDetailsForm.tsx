"use client"

import { useState } from "react"
import { ArrowLeft, Loader2, Lock, AlertCircle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import PriceBreakdown from "./PriceBreakdown"
import { formatDateLabel } from "./format"
import type { PublicListingView, QuoteBreakdown } from "./types"

export interface GuestDetails {
  fullName: string
  email: string
  phone: string
  country: string
  message: string
  arrivalTime: string
  acceptHouseRules: boolean
  acceptCancellation: boolean
  acceptTerms: boolean
  acceptDataSharing: boolean
}

interface GuestDetailsFormProps {
  listing: PublicListingView
  quote: QuoteBreakdown | null
  guests: number
  checkIn: string | null
  checkOut: string | null
  submitting: boolean
  submitError: string | null
  onBack: () => void
  onSubmit: (guest: GuestDetails) => void
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputCls =
  "w-full h-11 rounded-lg border border-[#D6E0F0] px-3.5 text-[14px] text-[#0B1B3F] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#1D4ED8] transition-shadow"

/**
 * Step 2 of checkout: guest contact details, optional arrival info, and the
 * legally-required acceptance checkboxes. All four acceptances are mandatory
 * (the server re-enforces this). Submits the booking as a HOLD — no payment is
 * taken here (P5).
 */
export default function GuestDetailsForm({
  listing,
  quote,
  guests,
  checkIn,
  checkOut,
  submitting,
  submitError,
  onBack,
  onSubmit,
}: GuestDetailsFormProps) {
  const [form, setForm] = useState<GuestDetails>({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    message: "",
    arrivalTime: "",
    acceptHouseRules: false,
    acceptCancellation: false,
    acceptTerms: false,
    acceptDataSharing: false,
  })
  const [touched, setTouched] = useState(false)

  function set<K extends keyof GuestDetails>(key: K, value: GuestDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const nameValid = form.fullName.trim().length >= 2
  const emailValid = EMAIL_RE.test(form.email.trim())
  const acceptedAll =
    form.acceptHouseRules &&
    form.acceptCancellation &&
    form.acceptTerms &&
    form.acceptDataSharing
  const canSubmit = nameValid && emailValid && acceptedAll && !submitting

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onSubmit({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      message: form.message.trim(),
      arrivalTime: form.arrivalTime.trim(),
    })
  }

  const checkboxes: { key: keyof GuestDetails; label: React.ReactNode }[] = [
    {
      key: "acceptHouseRules",
      label: "I accept the house rules for this property.",
    },
    {
      key: "acceptCancellation",
      label: "I accept the cancellation and refund policy.",
    },
    {
      key: "acceptTerms",
      label: (
        <>
          I accept the booking terms and the privacy policy.
        </>
      ),
    },
    {
      key: "acceptDataSharing",
      label:
        "I consent to my details being shared with the property manager to fulfil this booking.",
    },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1D4ED8] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dates
      </button>

      {/* Trip summary */}
      <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3">
        {checkIn && checkOut && (
          <p className="text-[13px] font-semibold text-[#0B1B3F]">
            {formatDateLabel(checkIn)} → {formatDateLabel(checkOut)}
          </p>
        )}
        <p className="text-[12px] text-slate-500 mt-0.5">
          {guests} guest{guests === 1 ? "" : "s"}
        </p>
      </div>

      {/* Contact fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-[12.5px] font-medium text-slate-600 mb-1">
            Full name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            autoComplete="name"
            className={cn(inputCls, touched && !nameValid && "border-red-300")}
            placeholder="Jane Smith"
            required
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-slate-600 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            className={cn(inputCls, touched && !emailValid && "border-red-300")}
            placeholder="jane@example.com"
            required
          />
          <p className="text-[11.5px] text-slate-400 mt-1">
            Your booking confirmation goes here.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-medium text-slate-600 mb-1">
              Phone
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              autoComplete="tel"
              className={inputCls}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-slate-600 mb-1">
              Country
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              autoComplete="country-name"
              className={inputCls}
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-slate-600 mb-1">
            Message to the property manager
          </label>
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={3}
            className={cn(inputCls, "h-auto py-2.5 resize-none")}
            placeholder="Arrival time, special requests, questions… (optional)"
            maxLength={2000}
          />
        </div>
      </div>

      {/* Price recap */}
      <div className="rounded-xl bg-[#F7F9FC] border border-[#EEF3FB] px-4 py-3.5">
        <PriceBreakdown quote={quote} />
      </div>

      {/* Legal acceptances */}
      <fieldset className="space-y-2.5">
        <legend className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Before you book
        </legend>
        {checkboxes.map(({ key, label }) => {
          const checked = form[key] as boolean
          const showErr = touched && !acceptedAll && !checked
          return (
            <label
              key={key as string}
              className="flex items-start gap-2.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => set(key, e.target.checked as never)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#2563EB]/40 shrink-0",
                  showErr && "ring-1 ring-red-300"
                )}
              />
              <span className="text-[12.5px] text-slate-600 leading-relaxed group-hover:text-slate-800">
                {label}
              </span>
            </label>
          )
        })}
      </fieldset>

      {submitError && (
        <div className="flex items-start gap-2 text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full h-12 rounded-xl bg-[#1D4ED8] text-white text-[14.5px] font-semibold hover:bg-[#1A45BE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Requesting your booking…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" /> Request to book
          </>
        )}
      </button>

      <p className="text-[11.5px] text-slate-400 text-center leading-relaxed flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        We&apos;ll hold your dates. No payment is taken now — the property manager
        confirms your booking.
      </p>
    </form>
  )
}
