"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Banknote, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { useAffiliate } from "../_useAffiliate"
import { formatPence, levelByBand, MIN_PAYOUT_PENCE } from "@/lib/affiliate/levels"
import { isAffiliatePayoutsEnabled } from "@/lib/affiliate/payout-flag"
import { requestAffiliatePayout } from "@/lib/affiliate/payouts"
import { Loader2 } from "lucide-react"

interface PayoutRow {
  id: string
  period: string | null
  amount_pence: number | null
  status: string
  paid_at: string | null
  created_at: string
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

export default function AffiliateEarningsPage() {
  const { loading: affLoading, affiliate, workspaceId, reload } = useAffiliate()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requestMsg, setRequestMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const payoutsEnabled = isAffiliatePayoutsEnabled()

  async function loadPayouts() {
    if (!workspaceId) return
    const supabase = createClient()
    const { data } = await supabase
      .from("affiliate_payouts")
      .select("id, period, amount_pence, status, paid_at, created_at")
      .eq("affiliate_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    if (data) setPayouts(data as PayoutRow[])
  }

  async function handleRequest() {
    if (!workspaceId) return
    setRequesting(true)
    setRequestMsg(null)
    const res = await requestAffiliatePayout(workspaceId)
    setRequesting(false)
    setRequestMsg({ ok: res.ok, text: res.ok ? "Payout requested. We'll review it shortly." : res.error ?? "Could not request payout." })
    if (res.ok) { await loadPayouts(); await reload() }
  }

  useEffect(() => {
    if (affLoading) return
    if (!affiliate?.enrolled || !workspaceId) { setLoading(false); return }
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("affiliate_payouts")
          .select("id, period, amount_pence, status, paid_at, created_at")
          .eq("affiliate_workspace_id", workspaceId)
          .order("created_at", { ascending: false })
        if (error && error.code !== "42P01") console.error(error)
        if (data) setPayouts(data as PayoutRow[])
      } finally {
        setLoading(false)
      }
    })()
  }, [affLoading, affiliate?.enrolled, workspaceId])

  if (affLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven't enrolled yet. <Link href="/affiliate" className="text-[#2563EB] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  const cleared = affiliate.cleared_pence ?? 0
  const canPayout = cleared >= MIN_PAYOUT_PENCE
  const level = levelByBand(affiliate.band)

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
        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-100">
          <p className="text-xs text-[#2563EB]">Cleared (payable)</p>
          <p className="text-2xl font-bold text-[#2563EB] mt-1">{formatPence(cleared)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#ECFDF5] border border-emerald-100">
          <p className="text-xs text-emerald-600">Paid out</p>
          <p className="text-2xl font-bold text-[#10B981] mt-1">{formatPence(affiliate.paid_pence ?? 0)}</p>
        </div>
      </div>

      {/* Payout status */}
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
                Payout account: {affiliate.payout_email ? <span className="font-medium text-slate-600">{affiliate.payout_email}</span> : <Link href="/affiliate/settings" className="text-[#2563EB] hover:underline">add payout details</Link>}.
              </p>
            </div>
          </div>
          {/* Request payout — flag-aware */}
          {(() => {
            const inFlight = payouts.find((p) => ["requested", "approved", "processing"].includes(p.status))
            if (inFlight) {
              return (
                <div className="flex items-start gap-2 rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs text-sky-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  You have a payout request {inFlight.status === "approved" ? "approved and awaiting payment" : "under review"} for {formatPence(inFlight.amount_pence ?? 0)}.
                </div>
              )
            }
            if (!payoutsEnabled) {
              return (
                <div className="flex items-start gap-2 rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs text-violet-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Payout requests open once payouts are enabled for the programme. Your cleared balance keeps accruing in the meantime, and you'll be able to request a payout from here. You are responsible for your own taxes.
                </div>
              )
            }
            return (
              <div className="space-y-2">
                <button
                  onClick={handleRequest}
                  disabled={!canPayout || requesting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {requesting ? "Requesting…" : `Request payout of ${formatPence(cleared)}`}
                </button>
                {!canPayout && (
                  <p className="text-xs text-slate-400">Reach {formatPence(MIN_PAYOUT_PENCE)} cleared to request a payout.</p>
                )}
                {requestMsg && (
                  <p className={`text-xs ${requestMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{requestMsg.text}</p>
                )}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                    <th className="pb-2 pr-4">Period</th>
                    <th className="pb-2 pr-4">Amount</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-4 text-xs text-slate-700">{p.period ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs font-semibold text-slate-800">{formatPence(p.amount_pence ?? 0)}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-2.5">{payoutBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
