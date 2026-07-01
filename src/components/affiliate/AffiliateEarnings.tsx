"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Banknote, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { useAffiliate } from "@/components/affiliate/useAffiliate"
import { formatPence, levelByBand, MIN_PAYOUT_PENCE } from "@/lib/affiliate/levels"
import { isAffiliatePayoutsEnabled } from "@/lib/affiliate/payout-flag"
import { getMonthlyEarnings, type MonthlyEarningsRow } from "@/lib/affiliate/dashboard-data"
import ConnectStatusBanner, { type ConnectBannerState } from "@/components/payments/ConnectStatusBanner"

interface PayoutRow {
  id: string
  period: string | null
  amount_pence: number | null
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
}

function payoutDate(p: PayoutRow): string {
  return p.paid_at
    ? new Date(p.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

function payoutBadge(s: string) {
  if (s === "paid") return <Badge variant="success" dot>Paid</Badge>
  if (s === "approved") return <Badge variant="success" dot>Approved</Badge>
  if (s === "processing" || s === "scheduled") return <Badge variant="sky" dot>{s}</Badge>
  if (s === "requested") return <Badge variant="sky" dot>Requested</Badge>
  if (s === "on_hold" || s === "pending_review") return <Badge variant="warning" dot>{s}</Badge>
  if (s === "failed" || s === "cancelled" || s === "rejected") return <Badge variant="danger" dot>{s}</Badge>
  return <Badge dot>{s}</Badge>
}

function formatMonth(m: string): string {
  // m = "YYYY-MM"
  const [year, month] = m.split("-")
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
}

export function AffiliateEarnings({ basePath }: { basePath: string }) {
  const { loading: affLoading, affiliate, workspaceId } = useAffiliate()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [monthly, setMonthly] = useState<MonthlyEarningsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [connect, setConnect] = useState<ConnectBannerState>({ connected: false, status: "none", payoutsEnabled: false })
  const payoutsEnabled = isAffiliatePayoutsEnabled()

  async function loadData() {
    if (!workspaceId) return
    const supabase = createClient()
    const [payoutsResult, monthlyResult, connectResult] = await Promise.all([
      supabase
        .from("affiliate_payouts")
        .select("id, period, amount_pence, method:payout_method, status, paid_at, created_at")
        .eq("affiliate_workspace_id", workspaceId)
        .order("created_at", { ascending: false }),
      getMonthlyEarnings(workspaceId),
      supabase
        .from("stripe_connect_accounts")
        .select("status, payouts_enabled")
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
    ])
    if (payoutsResult.data) setPayouts(payoutsResult.data as PayoutRow[])
    setMonthly(monthlyResult)
    const c = connectResult.data as { status?: string; payouts_enabled?: boolean } | null
    setConnect({
      connected: !!c,
      status: (c?.status as string) ?? "none",
      payoutsEnabled: c?.payouts_enabled === true,
    })
  }

  useEffect(() => {
    if (affLoading) return
    if (!affiliate?.enrolled || !workspaceId) { setLoading(false); return }
    ;(async () => {
      try { await loadData() } finally { setLoading(false) }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affLoading, affiliate?.enrolled, workspaceId])

  if (affLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven&apos;t enrolled yet. <Link href={basePath} className="text-[var(--brand)] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  const cleared = affiliate.cleared_pence ?? 0
  const canPayout = cleared >= MIN_PAYOUT_PENCE
  const level = levelByBand(affiliate.band)

  const totalGross = monthly.reduce((s, m) => s + m.gross_commission_pence, 0)
  const totalNet = monthly.reduce((s, m) => s + m.net_commission_pence, 0)
  const totalConversions = monthly.reduce((s, m) => s + m.conversions, 0)

  const payoutCardMapping: MobileCardMapping<PayoutRow> = {
    getKey: (p) => p.id,
    title: (p) => formatPence(p.amount_pence ?? 0),
    subtitle: (p) => p.period ?? "—",
    badge: (p) => payoutBadge(p.status),
    fields: [
      { label: "Date", render: (p) => payoutDate(p) },
      { label: "Method", render: (p) => p.method ?? "—" },
    ],
  }

  const monthlyCardMapping: MobileCardMapping<MonthlyEarningsRow> = {
    getKey: (m) => m.month,
    title: (m) => formatMonth(m.month),
    subtitle: (m) => `${m.conversions} conversion${m.conversions === 1 ? "" : "s"}`,
    badge: () => null,
    fields: [
      { label: "Gross", render: (m) => formatPence(m.gross_commission_pence) },
      { label: "Net", render: (m) => formatPence(m.net_commission_pence) },
    ],
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Earnings</h1>
        <p className="text-sm text-slate-500 mt-0.5">{level.name} · {Math.round(level.rate * 100)}% recurring for {level.durationMonths} months per referral.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-amber-100">
          <p className="text-xs text-amber-600">Pending (30-day cooling-off)</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-1">{formatPence(affiliate.pending_pence ?? 0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--brand-soft)] border border-[var(--color-brand-100)]">
          <p className="text-xs text-[var(--brand)]">Cleared (payable)</p>
          <p className="text-2xl font-bold text-[var(--brand)] mt-1">{formatPence(cleared)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#ECFDF5] border border-emerald-100">
          <p className="text-xs text-emerald-600">Paid out</p>
          <p className="text-2xl font-bold text-[#10B981] mt-1">{formatPence(affiliate.paid_pence ?? 0)}</p>
        </div>
      </div>

      {/* Network earn-through balance — only show when non-zero */}
      {((affiliate.sub_pending_pence ?? 0) + (affiliate.sub_cleared_pence ?? 0)) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" /> Network earn-through balance
            </CardTitle>
            <p className="text-xs text-slate-400">Commission earned from affiliates you recruited. Paid on the same schedule as direct commission.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-xs text-violet-600">Network pending</p>
                <p className="text-xl font-bold text-violet-700 mt-0.5">{formatPence(affiliate.sub_pending_pence ?? 0)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-600">Network cleared</p>
                <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatPence(affiliate.sub_cleared_pence ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-400" /> Monthly breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No commission history yet.</p>
          ) : (
            <>
              <ResponsiveTable rows={[...monthly].reverse()} mobile={monthlyCardMapping}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                      <th className="pb-2 pr-4">Month</th>
                      <th className="pb-2 pr-4">Conversions</th>
                      <th className="pb-2 pr-4">Gross commission</th>
                      <th className="pb-2">Net commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...monthly].reverse().map((m) => (
                      <tr key={m.month} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-4 text-xs font-medium text-slate-700 whitespace-nowrap">{formatMonth(m.month)}</td>
                        <td className="py-2.5 pr-4 text-xs text-slate-600">{m.conversions}</td>
                        <td className="py-2.5 pr-4 text-xs font-semibold text-slate-800">{formatPence(m.gross_commission_pence)}</td>
                        <td className="py-2.5 text-xs font-semibold text-[#059669]">{formatPence(m.net_commission_pence)}</td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="py-2.5 pr-4 text-xs font-bold text-slate-900">Total</td>
                      <td className="py-2.5 pr-4 text-xs font-bold text-slate-800">{totalConversions}</td>
                      <td className="py-2.5 pr-4 text-xs font-bold text-slate-900">{formatPence(totalGross)}</td>
                      <td className="py-2.5 text-xs font-bold text-[#059669]">{formatPence(totalNet)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </ResponsiveTable>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout request */}
      <Card>
        <CardHeader><CardTitle>Payout</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <Banknote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-sm text-slate-600">
              <p>
                Minimum payout is {formatPence(MIN_PAYOUT_PENCE)}. {canPayout
                  ? "Your cleared balance is eligible for the next payout run."
                  : `You need ${formatPence(MIN_PAYOUT_PENCE - cleared)} more cleared commission to reach the threshold.`}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Payout account: {affiliate.payout_email
                  ? <span className="font-medium text-slate-600">{affiliate.payout_email}</span>
                  : <Link href={`${basePath}/settings`} className="text-[var(--brand)] hover:underline">add payout details</Link>}.
              </p>
            </div>
          </div>
          {(() => {
            if (!payoutsEnabled) {
              return (
                <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs text-violet-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Payouts coming soon — your cleared balance keeps accruing and you&apos;ll be paid automatically once the programme opens. You are responsible for your own taxes.
                </div>
              )
            }
            // Payouts are automated via Stripe Connect. First the affiliate must
            // connect a payouts-enabled Stripe account; then cleared balances are
            // paid automatically on the payout run — no manual request needed.
            if (!connect.payoutsEnabled) {
              return (
                <div className="space-y-2">
                  <ConnectStatusBanner state={connect} purpose="affiliate" />
                  <p className="text-xs text-slate-400">
                    Once connected, cleared commission of {formatPence(MIN_PAYOUT_PENCE)} or more is paid to you automatically. You are responsible for your own taxes.
                  </p>
                </div>
              )
            }
            const inFlight = payouts.find((p) => ["requested", "approved", "processing"].includes(p.status))
            return (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {inFlight
                  ? <>A payout of {formatPence(inFlight.amount_pence ?? 0)} is {inFlight.status === "paid" ? "paid" : "on its way"} to your connected Stripe account.</>
                  : canPayout
                  ? <>Payouts are automatic — your cleared balance of {formatPence(cleared)} will be paid to your connected Stripe account on the next payout run. You are responsible for your own taxes.</>
                  : <>Payouts are automatic once your cleared balance reaches {formatPence(MIN_PAYOUT_PENCE)}. It&apos;s then paid to your connected Stripe account. You are responsible for your own taxes.</>}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Payout history */}
      <Card>
        <CardHeader><CardTitle>Payout history</CardTitle></CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No payouts yet.</p>
          ) : (
            <ResponsiveTable rows={payouts} mobile={payoutCardMapping}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Method</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-4 text-xs text-slate-700">{p.period ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs font-semibold text-slate-800">{formatPence(p.amount_pence ?? 0)}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 capitalize">{p.method ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{payoutDate(p)}</td>
                      <td className="py-2.5">{payoutBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
