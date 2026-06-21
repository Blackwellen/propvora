"use client"

import React, { useState } from "react"
import Link from "next/link"
import { UserPlus, Mail, CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = "details" | "message" | "confirm"

const STEPS: { id: Step; label: string }[] = [
  { id: "details", label: "Contact details" },
  { id: "message", label: "Message" },
  { id: "confirm", label: "Confirm" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface InviteWizardProps {
  /** Called when the wizard is submitted. Receives name + email. */
  onSubmit?: (data: { name: string; email: string; message: string }) => void
  /** Called when the wizard is cancelled */
  onCancel?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteWizard({ onSubmit, onCancel }: InviteWizardProps) {
  const [step, setStep] = useState<Step>("details")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState(
    "Hi, I'd like to add you as a supplier to our Propvora workspace. Please complete your profile at your earliest convenience."
  )
  const [submitted, setSubmitted] = useState(false)

  function advance() {
    if (step === "details") setStep("message")
    else if (step === "message") setStep("confirm")
    else {
      onSubmit?.({ name, email, message })
      setSubmitted(true)
    }
  }

  function back() {
    if (step === "message") setStep("details")
    else if (step === "confirm") setStep("message")
  }

  const currentIdx = STEPS.findIndex((s) => s.id === step)
  const canAdvance = step === "details" ? name.trim() !== "" && email.trim() !== "" : true

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="text-[16px] font-bold text-slate-900 mb-1">Invitation sent</h3>
        <p className="text-[13px] text-slate-500 mb-6">
          We&apos;ve sent an invite to <strong>{email}</strong>. They&apos;ll appear in your directory once they join.
        </p>
        <Link
          href="/property-manager/suppliers/directory"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                  i < currentIdx
                    ? "bg-emerald-500 text-white"
                    : i === currentIdx
                    ? "bg-[#2563EB] text-white"
                    : "bg-slate-100 text-slate-400"
                )}
              >
                {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[12px] font-medium",
                  i === currentIdx ? "text-slate-900" : "text-slate-400"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      {step === "details" && (
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Supplier name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Plumbing Ltd"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supplier@example.com"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>
        </div>
      )}

      {step === "message" && (
        <div>
          <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Invitation message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
          />
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <p className="text-[13px] font-semibold text-slate-800">Review your invitation</p>
          <div className="space-y-2 text-[12.5px] text-slate-600">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{email}</span>
            </div>
            <p className="mt-2 text-slate-500 leading-relaxed border-t border-slate-200 pt-3">{message}</p>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={step === "details" ? onCancel : back}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {step === "details" ? "Cancel" : "Back"}
        </button>
        <button
          onClick={advance}
          disabled={!canAdvance}
          className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-[13px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === "confirm" ? "Send Invitation" : "Next"}
        </button>
      </div>
    </div>
  )
}
