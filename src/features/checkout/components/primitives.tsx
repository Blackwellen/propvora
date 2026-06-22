"use client"

// ============================================================================
// Checkout — shared UI primitives (cards, fields, toggles, trust elements).
// Premium Propvora visual system. Light tokens only — NEVER `dark:`.
// ============================================================================

import { useState, type ReactNode } from "react"
import {
  ShieldCheck,
  Lock,
  BadgeCheck,
  CreditCard,
  Building2,
  Wallet,
  Check,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import type { CheckoutPaymentMethod, PaymentMethodType } from "../data/types"

// ── Section card ──────────────────────────────────────────────────────────────
export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-[#E2EAF6] bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#EEF2F9]">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0B1B3F]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[12.5px] text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

// ── Labelled field ────────────────────────────────────────────────────────────
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-slate-600">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-slate-400">{hint}</span> : null}
    </label>
  )
}

const inputBase =
  "w-full rounded-xl border border-[#D8E1F0] bg-white px-3.5 py-2.5 text-[14px] text-[#0B1B3F] placeholder:text-slate-400 shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[88px] resize-y ${props.className ?? ""}`} />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />
}

// ── Char-counted textarea ────────────────────────────────────────────────────
export function CountedTextArea({
  value,
  onChange,
  max = 500,
  placeholder,
  id,
}: {
  value: string
  onChange: (v: string) => void
  max?: number
  placeholder?: string
  id?: string
}) {
  return (
    <div>
      <TextArea
        id={id}
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
      />
      <div className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
        {value.length}/{max}
      </div>
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[13px] font-medium text-slate-700"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-[#2563EB]" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      {label}
    </button>
  )
}

// ── Checkbox row (add-ons, extras) ────────────────────────────────────────────
export function CheckRow({
  checked,
  onChange,
  label,
  pricePence,
  currency = "GBP",
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  pricePence?: number
  currency?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        checked ? "border-[#2563EB] bg-[#EFF5FF]" : "border-[#E2EAF6] bg-white hover:border-[#CBD8EE]"
      }`}
    >
      <span className="flex items-center gap-2.5">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
            checked ? "border-[#2563EB] bg-[#2563EB] text-white" : "border-slate-300 bg-white"
          }`}
        >
          {checked ? <Check className="h-3.5 w-3.5" /> : null}
        </span>
        <span className="text-[13.5px] font-medium text-[#0B1B3F]">{label}</span>
      </span>
      {typeof pricePence === "number" ? (
        <span className="text-[13px] font-semibold tabular-nums text-slate-700">
          + {formatPence(pricePence, currency)}
        </span>
      ) : null}
    </button>
  )
}

// ── Trust bar ─────────────────────────────────────────────────────────────────
const TRUST = [
  { label: "Best price guarantee", icon: BadgeCheck },
  { label: "Free cancellation", icon: ShieldCheck },
  { label: "Secure payments", icon: Lock },
  { label: "24/7 support", icon: ShieldCheck },
]

export function TrustBar() {
  return (
    // 2×2 in the narrow checkout rail (4-up cramped + wrapped the labels).
    <div className="grid grid-cols-2 gap-2">
      {TRUST.map((t) => (
        <div
          key={t.label}
          className="flex items-center gap-2 rounded-xl border border-[#E2EAF6] bg-white px-3 py-2.5 shadow-sm"
        >
          <t.icon className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="text-[11.5px] font-medium leading-snug text-slate-600">{t.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Security copy ─────────────────────────────────────────────────────────────
export function SecurityNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#E2EAF6] bg-[#F7FAFF] px-3.5 py-3">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden="true" />
      <p className="text-[12px] leading-relaxed text-slate-600">
        Your payment is protected with <strong className="font-semibold text-slate-700">256-bit SSL</strong>{" "}
        encryption. Card details are tokenised and never stored on Propvora servers.
      </p>
    </div>
  )
}

// ── Payment method picker ─────────────────────────────────────────────────────
const PM_META: Record<PaymentMethodType, { label: string; icon: typeof CreditCard }> = {
  card: { label: "Card", icon: CreditCard },
  apple_pay: { label: "Apple Pay", icon: Wallet },
  google_pay: { label: "Google Pay", icon: Wallet },
  bank_transfer: { label: "Bank transfer", icon: Building2 },
}

export function PaymentMethodPicker({
  methods,
  selectedId,
  onSelect,
}: {
  methods: CheckoutPaymentMethod[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Always show the 4 canonical methods even if only some are stored.
  const present = new Set(methods.map((m) => m.method_type))
  const synthetic: CheckoutPaymentMethod[] = (
    ["card", "apple_pay", "google_pay", "bank_transfer"] as PaymentMethodType[]
  )
    .filter((t) => !present.has(t))
    .map((t) => ({
      id: `synthetic-${t}`,
      checkout_session_id: methods[0]?.checkout_session_id ?? "",
      method_type: t,
      brand: null,
      last4: null,
      exp_label: null,
      is_default: false,
    }))
  const all = [...methods, ...synthetic]

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {all.map((m) => {
        const meta = PM_META[m.method_type]
        const active = selectedId === m.id
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
              active ? "border-[#2563EB] bg-[#EFF5FF] ring-1 ring-[#2563EB]/20" : "border-[#E2EAF6] bg-white hover:border-[#CBD8EE]"
            }`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                active ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              <meta.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[#0B1B3F]">{meta.label}</span>
              {m.last4 ? (
                <span className="block text-[11.5px] text-slate-400">
                  {m.brand ?? "Card"} •••• {m.last4}
                </span>
              ) : (
                <span className="block text-[11.5px] text-slate-400">Fast & secure</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Confirm modal (pay / dispatch actions) ───────────────────────────────────
export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  tone = "primary",
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: ReactNode
  confirmLabel: string
  tone?: "primary" | "danger"
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
        <h3 className="text-[16px] font-semibold text-[#0B1B3F]">{title}</h3>
        <div className="mt-2 text-[13px] leading-relaxed text-slate-600">{body}</div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-[#D8E1F0] bg-white px-4 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-xl px-4 text-[14px] font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
              tone === "danger" ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
            }`}
          >
            {loading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Primary action button ─────────────────────────────────────────────────────
export function PrimaryButton({
  children,
  onClick,
  tone = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode
  onClick?: () => void
  tone?: "primary" | "danger"
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        tone === "danger" ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#2563EB] hover:bg-[#1D4ED8]"
      }`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-[#2563EB] transition-colors hover:bg-[#EFF5FF]"
    >
      {children}
    </button>
  )
}

// ── Toast (lightweight, self-dismissing) ─────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null)
  function show(text: string, tone: "ok" | "err" = "ok") {
    setMsg({ text, tone })
    setTimeout(() => setMsg(null), 3500)
  }
  const node = msg ? (
    <div
      className={`fixed inset-x-0 bottom-4 z-[60] mx-auto w-fit max-w-[90vw] rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg ${
        msg.tone === "ok" ? "bg-emerald-600" : "bg-[#DC2626]"
      }`}
    >
      {msg.text}
    </div>
  ) : null
  return { show, node }
}
