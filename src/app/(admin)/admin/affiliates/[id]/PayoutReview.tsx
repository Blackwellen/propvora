"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Banknote, Check, X, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { formatPence } from "@/lib/affiliate/levels"
import {
  approveAffiliatePayout,
  rejectAffiliatePayout,
  markAffiliatePayoutPaid,
  payAffiliatePayoutViaStripe,
} from "@/lib/affiliate/payouts"

export interface PayoutReviewRow {
  id: string
  period: string | null
  amount_pence: number | null
  status: string
  requested_at: string | null
  paid_at: string | null
  payout_email: string | null
  payout_reference: string | null
  review_note: string | null
}

function badge(s: string) {
  if (s === "paid") return <Badge variant="success" dot>Paid</Badge>
  if (s === "approved") return <Badge variant="success" dot>Approved</Badge>
  if (s === "requested") return <Badge variant="sky" dot>Requested</Badge>
  if (s === "rejected" || s === "failed" || s === "cancelled") return <Badge variant="danger" dot>{s}</Badge>
  return <Badge dot>{s}</Badge>
}

function fmt(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"
}

export default function PayoutReview({ payouts }: { payouts: PayoutReviewRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyId(id)
    setError(null)
    const res = await fn()
    setBusyId(null)
    if (!res.ok) setError(res.error ?? "Action failed.")
    else router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle>Payout requests</CardTitle></CardHeader>
      <CardContent>
        {error && <p className="text-xs text-rose-600 mb-3">{error}</p>}
        {payouts.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No payout requests.</p>
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => {
              const busy = busyId === p.id
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{formatPence(p.amount_pence ?? 0)}</p>
                      {badge(p.status)}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {p.period ?? "—"} · requested {fmt(p.requested_at)}
                      {p.payout_email ? ` · ${p.payout_email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {busy && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                    {p.status === "requested" && (
                      <>
                        <button
                          onClick={() => run(p.id, () => approveAffiliatePayout(p.id))}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white text-xs font-medium px-2.5 py-1.5 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => run(p.id, () => rejectAffiliatePayout(p.id))}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1.5 hover:bg-white disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <>
                        <button
                          onClick={() => run(p.id, () => payAffiliatePayoutViaStripe(p.id))}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md bg-[#2563EB] text-white text-xs font-medium px-2.5 py-1.5 hover:bg-blue-700 disabled:opacity-50"
                          title="Pay automatically via Stripe Connect transfer to the affiliate's connected account"
                        >
                          <Banknote className="w-3.5 h-3.5" /> Pay via Stripe
                        </button>
                        <button
                          onClick={() => run(p.id, () => markAffiliatePayoutPaid(p.id))}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                          title="Record a manual/off-Stripe payment"
                        >
                          Mark paid (manual)
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
