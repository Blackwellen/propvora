"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Clock,
  Mail,
  CalendarClock,
  CopyCheck,
  Copy,
} from "lucide-react"
import { useState } from "react"

/**
 * Honest, premium booking confirmation. Payment capture is P5, so this page
 * NEVER claims payment was taken — it presents the reservation as HELD /
 * pending and explains the next steps. Reference + status come from the
 * reserve response via query params.
 */
export default function ConfirmationClient() {
  const params = useParams()
  const search = useSearchParams()
  const slug = (Array.isArray(params?.slug) ? params.slug[0] : params?.slug) as
    | string
    | undefined

  const reference = search.get("ref")
  const status = search.get("status") ?? "pending_payment"

  const [copied, setCopied] = useState(false)

  function copyRef() {
    if (!reference) return
    navigator.clipboard
      ?.writeText(reference)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  const isConfirmed = status === "confirmed"

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="rounded-2xl border border-[#E2EAF6] bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 text-center border-b border-[#EEF3FB]">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isConfirmed ? "bg-emerald-100" : "bg-blue-100"
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <Clock className="w-8 h-8 text-[#1D4ED8]" />
            )}
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#0B1B3F]">
            {isConfirmed ? "Your booking is confirmed" : "We've got your booking"}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
            {isConfirmed
              ? "Everything is set — see the details below."
              : "Your dates are being held. The property manager will review and confirm shortly. No payment has been taken yet."}
          </p>
        </div>

        {/* Reference */}
        {reference && (
          <div className="px-6 sm:px-8 py-5 border-b border-[#EEF3FB]">
            <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Booking reference
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[16px] font-bold text-[#0B1B3F] tabular-nums break-all">
                {reference}
              </span>
              <button
                type="button"
                onClick={copyRef}
                className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1D4ED8] hover:underline"
              >
                {copied ? (
                  <>
                    <CopyCheck className="w-4 h-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-[12px] text-slate-400 mt-1.5">
              Keep this reference — you&apos;ll need it for any questions about your
              stay.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="px-6 sm:px-8 py-6">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-3">
            What happens next
          </p>
          <ol className="space-y-3.5">
            <Step
              icon={<Mail className="w-4 h-4 text-[#1D4ED8]" />}
              title="Check your email"
              body="We've sent your booking details and reference to the email you provided."
            />
            <Step
              icon={<CalendarClock className="w-4 h-4 text-[#1D4ED8]" />}
              title="The property manager confirms"
              body="They'll review your dates and confirm your stay. You'll be notified by email."
            />
            <Step
              icon={<CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />}
              title="Payment & check-in details"
              body="Once confirmed, you'll receive payment instructions and your arrival information."
            />
          </ol>
        </div>

        {/* Actions */}
        <div className="px-6 sm:px-8 pb-7 flex flex-col sm:flex-row gap-3">
          {slug && (
            <Link
              href={`/stay/${encodeURIComponent(slug)}`}
              className="flex-1 h-11 rounded-xl border border-[#D6E0F0] text-[#1D4ED8] text-[14px] font-semibold flex items-center justify-center hover:bg-blue-50 transition-colors"
            >
              Back to the listing
            </Link>
          )}
          <Link
            href="/"
            className="flex-1 h-11 rounded-xl bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center hover:bg-[#1A45BE] transition-colors"
          >
            Done
          </Link>
        </div>
      </div>

      <p className="text-center text-[11.5px] text-slate-400 mt-5">
        Powered by <span className="font-semibold text-slate-500">Propvora</span> ·
        Secure direct booking
      </p>
    </div>
  )
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </span>
      <span>
        <span className="block text-[13.5px] font-semibold text-[#0B1B3F]">
          {title}
        </span>
        <span className="block text-[12.5px] text-slate-500 leading-relaxed mt-0.5">
          {body}
        </span>
      </span>
    </li>
  )
}
