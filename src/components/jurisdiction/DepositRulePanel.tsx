"use client"

/**
 * DepositRulePanel — the jurisdiction deposit rule for a property, rendered with
 * the sourced cap (via <SourcedValue>), an over-cap warning, the protection /
 * prescribed-information / return-window facts, and the permanent disclaimer.
 *
 * Reusable across Tenancy ▸ Deposit, Money ▸ Deposits and the Track Deposit
 * wizard. Supply the property's jurisdiction + monthly rent (+ the current
 * deposit to enable the over-cap check).
 */

import { Shield, AlertTriangle, Check, X } from "lucide-react"
import { depositRules, depositCapSourced, isOverCap } from "@/lib/money/deposits"
import { resolveValue } from "@/lib/jurisdiction/resolve"
import { formatMoneyMajor } from "@/lib/i18n"
import { SourcedValue } from "./SourcedValue"
import { NotLegalAdviceNotice } from "./NotLegalAdviceNotice"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-[13px] font-medium text-slate-800">{children}</span>
    </div>
  )
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600">
      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Required
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <X className="h-3.5 w-3.5" aria-hidden="true" /> Not required
    </span>
  )
}

export function DepositRulePanel({
  countryCode,
  region,
  monthlyRent,
  currency = "GBP",
  annualRent,
  currentDeposit,
  className = "",
}: {
  countryCode: string
  region?: string | null
  monthlyRent: number
  currency?: string
  annualRent?: number
  currentDeposit?: number | null
  className?: string
}) {
  const rule = depositRules(countryCode, region)
  const capSourced = depositCapSourced(rule, monthlyRent, annualRent)
  const resolvedCap = resolveValue<number>({ sourced: capSourced })
  const over = currentDeposit != null && isOverCap(rule, currentDeposit, monthlyRent, annualRent)

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
        <span className="text-sm font-bold text-slate-800">Deposit rule ({rule.jurisdiction})</span>
      </div>

      <div className="flex flex-col divide-y divide-slate-100">
        <Row label="Scheme">{rule.scheme ?? "—"}</Row>
        <Row label="Maximum deposit">
          <SourcedValue
            resolved={resolvedCap}
            format={(v) => formatMoneyMajor(v, currency)}
            hideChip={false}
          />
        </Row>
        <Row label="Protection / lodging">
          <YesNo value={rule.protectionRequired} />
          {rule.protectionRequired && rule.protectionWindowDays != null && (
            <span className="ml-1 text-[11px] text-slate-400">within {rule.protectionWindowDays}d</span>
          )}
        </Row>
        <Row label="Prescribed information">
          <YesNo value={rule.prescribedInfo} />
        </Row>
        {rule.returnWindowDays != null && <Row label="Return window">{rule.returnWindowDays} days</Row>}
        {rule.disputesBody && <Row label="Disputes">{rule.disputesBody}</Row>}
      </div>

      {over && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed text-amber-700">
            The recorded deposit{currentDeposit != null ? ` (${formatMoneyMajor(currentDeposit, currency)})` : ""} exceeds
            the indicative cap for this jurisdiction. Verify against the scheme rules — a deposit above the cap may not be
            enforceable.
          </p>
        </div>
      )}

      <NotLegalAdviceNotice variant="inline" className="mt-3" />
    </div>
  )
}

export default DepositRulePanel
