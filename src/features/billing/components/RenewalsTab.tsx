"use client"

import React, { useState } from "react"
import {
  CalendarClock, RefreshCw, ArrowUpRight, ArrowDownRight, Mail,
  Bell, CreditCard, CheckCircle2, AlertTriangle, ChevronRight,
} from "lucide-react"
import { formatPence } from "@/lib/marketplace/money"
import { useSubscription, useRenewalEvents, usePaymentMethod, useBillingRole, useActiveAddons } from "../data/hooks"
import { SEED_ADDON_CATALOG } from "../data/seed"
import { addonMonthlyPence, formatBillingDate } from "../data/calc"
import { openBillingPortal } from "../data/stripe-link"
import { useCancellationState } from "../data/cancellation-context"
import { BillingCard, Row, StatusBadge, BillingButton, Toggle, PermissionNotice } from "./ui"

const STATUS_LABEL: Record<string, string> = {
  active: "Active", trialing: "Trialing", past_due: "Past due", cancelled: "Cancelled", paused: "Paused",
}
const STATUS_TONE: Record<string, "blue" | "emerald" | "amber" | "red" | "slate"> = {
  active: "emerald", trialing: "blue", past_due: "amber", cancelled: "red", paused: "amber",
}

const BASE = "/property-manager/workspace/billing"

export function RenewalsTab({ basePath = BASE }: { basePath?: string }) {
  const { data: sub } = useSubscription()
  const { data: renewals } = useRenewalEvents()
  const { data: card } = usePaymentMethod()
  const { data: activeAddons } = useActiveAddons()
  const { canManageBilling } = useBillingRole()
  // Auto-renew is the inverse of a scheduled cancel-at-period-end. It shares the
  // single cancellation source of truth (context) so the toggle, the Cancellation
  // tab and the summary rail can never disagree, and the change is persisted to
  // Stripe via /api/billing/resume | /api/billing/cancel rather than local-only.
  const { view, schedule, keep, busy, error: autoRenewError } = useCancellationState()
  const autoRenew = !view.scheduled && sub.autoRenew
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  async function toggleAutoRenew(next: boolean) {
    if (next) await keep()
    else await schedule({ reason: "Auto-renew turned off" })
  }

  const estimate = renewals.find((r) => r.kind === "estimate")
  const reminders = renewals.filter((r) => r.kind === "reminder")
  const timeline = renewals.filter((r) => r.kind === "renewal").sort((a, b) => (a.dueAt ?? "").localeCompare(b.dueAt ?? ""))

  const addonLines = activeAddons
    .filter((a) => a.enabled)
    .map((a) => {
      const item = SEED_ADDON_CATALOG.find((c) => c.code === a.code)
      return item ? { name: item.name, pence: addonMonthlyPence(item, a) } : null
    })
    .filter((x): x is { name: string; pence: number } => x != null)
  const addonsTotal = addonLines.reduce((acc, l) => acc + l.pence, 0)

  const cardHealthy = card?.health === "healthy"

  async function manageCard() {
    setPortalError(null)
    try { await openBillingPortal() } catch (e) {
      setPortalError(e instanceof Error ? e.message : "Card management is unavailable until billing is provisioned.")
    }
  }

  return (
    <div className="space-y-6">
      <PermissionNotice canManage={canManageBilling} />

      <BillingCard title="Renewal summary" icon={CalendarClock}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <Row label="Status" value={<StatusBadge tone={STATUS_TONE[sub.status] ?? "slate"}>{STATUS_LABEL[sub.status] ?? sub.status}</StatusBadge>} />
          <Row label="Next renewal" value={formatBillingDate(sub.currentPeriodEnd)} />
          <Row label="Plan" value={<span className="capitalize">{sub.planCode}</span>} />
          <Row label="Billing cycle" value={<span className="capitalize">{sub.billingCycle}</span>} />
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <span className="text-[12.5px] text-slate-500">Auto-renew</span>
            <div className="flex items-center gap-2">
              <Toggle label="Toggle auto-renew" checked={autoRenew} disabled={!canManageBilling || busy} onChange={(v) => void toggleAutoRenew(v)} />
              <span className="text-[12px] font-semibold text-slate-700">{busy ? "Saving…" : autoRenew ? "On" : "Off"}</span>
            </div>
          </div>
          <Row label="Upcoming invoice" value={estimate?.amountPence != null ? `${formatPence(estimate.amountPence)} inc. VAT` : "—"} />
        </div>

        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:text-[var(--brand)]"
        >
          View full breakdown <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showBreakdown ? "rotate-90" : ""}`} />
        </button>
        {showBreakdown && (
          <div className="mt-2 rounded-xl bg-slate-50 p-3 space-y-0.5">
            <Row label={`Base plan (${sub.planCode})`} value={formatPence(sub.basePricePence)} />
            {addonLines.length === 0 ? (
              <Row label="Add-ons" value={<span className="text-slate-400">None</span>} />
            ) : (
              addonLines.map((l) => <Row key={l.name} label={l.name} value={formatPence(l.pence)} />)
            )}
            <Row label="Add-ons subtotal" value={formatPence(addonsTotal)} />
            {estimate?.amountPence != null ? (
              <Row label="Total at renewal (inc. VAT)" value={<span className="font-bold">{formatPence(estimate.amountPence)}</span>} />
            ) : (
              <p className="text-[11px] text-slate-400 pt-1">VAT and the final renewal total are confirmed on your next invoice.</p>
            )}
          </div>
        )}
        {autoRenewError && (
          <p className="mt-3 text-[12px] text-red-600">{autoRenewError}</p>
        )}
        {!autoRenew && (
          <p className="mt-3 text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Auto-renew is off. Your plan will end on {formatBillingDate(sub.currentPeriodEnd)} unless you renew manually.
          </p>
        )}
      </BillingCard>

      <BillingCard title="Manage plan" icon={RefreshCw} description="Move up or down a tier, or talk to our team.">
        <div className="flex flex-wrap gap-2.5">
          <BillingButton href={`${basePath}/checkout`} variant="primary" icon={ArrowUpRight} disabled={!canManageBilling}>Upgrade</BillingButton>
          <BillingButton href={`${basePath}/checkout`} variant="ghost" icon={ArrowDownRight} disabled={!canManageBilling}>Downgrade</BillingButton>
          <BillingButton href="mailto:sales@propvora.com?subject=Plan%20enquiry" variant="secondary" icon={Mail}>Contact sales</BillingButton>
        </div>
      </BillingCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BillingCard title="Renewal reminders" icon={Bell}>
          <ul className="space-y-3">
            {reminders.length === 0 && <li className="text-[12.5px] text-slate-400">No reminders scheduled.</li>}
            {reminders.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-slate-800">{r.title}</p>
                  <p className="text-[12px] text-slate-500">{r.detail} · {formatBillingDate(r.dueAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </BillingCard>

        <BillingCard title="Payment method health" icon={CreditCard}>
          {card ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
                <span className="text-[13px] text-slate-700">{card.brand} ending {card.last4} · exp {String(card.expMonth).padStart(2, "0")}/{card.expYear}</span>
                {cardHealthy ? (
                  <StatusBadge tone="emerald"><CheckCircle2 className="w-3 h-3" /> Healthy</StatusBadge>
                ) : (
                  <StatusBadge tone="amber"><AlertTriangle className="w-3 h-3" /> {card.health}</StatusBadge>
                )}
              </div>
              {!cardHealthy && (
                <BillingButton variant="secondary" className="mt-3" disabled={!canManageBilling} onClick={manageCard}>Update card</BillingButton>
              )}
            </>
          ) : (
            <>
              <p className="text-[13px] text-slate-400 px-1">No payment method on file. Add a card to enable automatic renewals.</p>
              <BillingButton variant="secondary" className="mt-3" disabled={!canManageBilling} onClick={manageCard}>Add card</BillingButton>
            </>
          )}
          {portalError && <p className="text-[11px] text-amber-600 mt-2">{portalError}</p>}
        </BillingCard>
      </div>

      <BillingCard title="Plan renewal timeline" icon={CalendarClock}>
        <ol className="relative border-l border-slate-200 ml-2 space-y-4">
          {timeline.map((t) => (
            <li key={t.id} className="ml-4">
              <span className={`absolute -left-1.5 w-3 h-3 rounded-full ${t.status === "completed" ? "bg-emerald-500" : "bg-[var(--brand)]"}`} />
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-800">{t.title}</p>
                <span className="text-[12px] text-slate-400">{formatBillingDate(t.dueAt)}</span>
              </div>
              <p className="text-[12px] text-slate-500">{t.detail}{t.amountPence != null ? ` · ${formatPence(t.amountPence)}` : ""}</p>
            </li>
          ))}
        </ol>
      </BillingCard>
    </div>
  )
}
