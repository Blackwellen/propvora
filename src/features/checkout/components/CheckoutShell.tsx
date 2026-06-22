"use client"

// ============================================================================
// CheckoutShell — the dedicated secure-checkout chrome shared by every screen.
//
//   * Propvora logo + secure-checkout badge
//   * 3-step progress stepper (Details / Payment / Review)
//   * two-column layout: body (left) + sticky order summary (right, passed in)
//   * trust bar + 256-bit SSL security copy in the footer rail
//
// `embedded` = true renders WITHOUT the outer page chrome (logo header / page
// background) so the authenticated /property-manager/checkout/* variant can sit
// inside the app shell while reusing the same stepper + layout.
// ============================================================================

import Link from "next/link"
import Image from "next/image"
import type { ReactNode } from "react"
import { ShieldCheck, Lock, Check } from "lucide-react"
import { TrustBar, SecurityNote } from "./primitives"

export type CheckoutStep = "details" | "payment" | "review"

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
]

export function Stepper({ current }: { current: CheckoutStep }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="flex items-center gap-1.5 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <li key={s.key} className="flex items-center gap-1.5 sm:gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                  ? "bg-[#2563EB] text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`text-[12.5px] font-semibold ${
                active ? "text-[#0B1B3F]" : done ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className={`hidden h-px w-6 sm:inline-block sm:w-8 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

export function CheckoutShell({
  step,
  title,
  subtitle,
  summary,
  embedded = false,
  children,
}: {
  step: CheckoutStep
  title: string
  subtitle?: string
  summary: ReactNode
  embedded?: boolean
  children: ReactNode
}) {
  const inner = (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Title + stepper */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[#0B1B3F] sm:text-[24px]">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p> : null}
        </div>
        <Stepper current={step} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Body */}
        <div className="flex flex-col gap-4">{children}</div>

        {/* Right rail: summary + trust + security */}
        <div className="flex flex-col gap-4">
          {summary}
          <TrustBar />
          <SecurityNote />
        </div>
      </div>
    </div>
  )

  if (embedded) return inner

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FC] text-[#0B1B3F] antialiased">
      <header className="sticky top-0 z-30 border-b border-[#E2EAF6] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40">
            <Image src="/propvora-logo-dark.png" alt="Propvora" width={420} height={105} className="h-7 w-auto" priority />
            <span className="hidden h-4 w-px bg-[#E2EAF6] sm:inline-block" />
            <span className="hidden text-[12.5px] font-medium text-slate-500 sm:inline">Secure checkout</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[12px] font-medium text-slate-500 sm:flex">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" /> 256-bit SSL
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Secure
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">{inner}</main>

      <footer className="border-t border-[#E2EAF6] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-4 py-5 sm:flex-row sm:items-center sm:px-6">
          <p className="max-w-xl text-[12px] leading-relaxed text-slate-500">
            Payments are processed securely. Propvora provides the checkout software; the contract is between you and the
            provider unless stated otherwise.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-slate-500">
            <Link href="/legal" className="transition-colors hover:text-[#1D4ED8]">Terms</Link>
            <Link href="/legal" className="transition-colors hover:text-[#1D4ED8]">Privacy</Link>
            <span>© {new Date().getFullYear()} Propvora</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Shared loading / error / empty states ────────────────────────────────────
export function CheckoutLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-[#E2EAF6] bg-white" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl border border-[#E2EAF6] bg-white" />
      </div>
    </div>
  )
}

export function CheckoutError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-[#E2EAF6] bg-white p-8 shadow-sm">
        <h2 className="text-[16px] font-semibold text-[#0B1B3F]">We couldn’t load this checkout</h2>
        <p className="mt-1.5 text-[13px] text-slate-500">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#2563EB] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
