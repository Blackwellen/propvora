import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, UserCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createAdminClient } from "@/lib/supabase/admin"
import { levelByBand, formatPence } from "@/lib/affiliate/levels"
import AffiliateActions from "./AffiliateActions"
import PayoutReview, { type PayoutReviewRow } from "./PayoutReview"

export const dynamic = "force-dynamic"

interface PageProps { params: Promise<{ id: string }> }

async function getAffiliate(workspaceId: string) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("affiliates")
      .select("workspace_id, enrolled, approved, origin, band, referral_code, payout_email, public_handle, active_referrals_count, pending_pence, cleared_pence, paid_pence, created_at, applied_at")
      .eq("workspace_id", workspaceId)
      .maybeSingle()
    if (!data) return null

    let workspaceName: string | null = null
    try {
      const { data: ws } = await admin.from("workspaces").select("name").eq("id", workspaceId).maybeSingle()
      workspaceName = (ws?.name as string) ?? null
    } catch { /* ignore */ }

    return { data, workspaceName }
  } catch {
    return null
  }
}

async function getPayouts(workspaceId: string): Promise<PayoutReviewRow[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("affiliate_payouts")
      .select("id, period, amount_pence, status, requested_at, paid_at, payout_email, payout_reference, review_note")
      .eq("affiliate_workspace_id", workspaceId)
      .order("created_at", { ascending: false })
    return (data as PayoutReviewRow[]) ?? []
  } catch {
    return []
  }
}

export default async function AdminAffiliateDetailPage({ params }: PageProps) {
  const { id } = await params
  const result = await getAffiliate(id)
  if (!result) notFound()
  const { data: aff, workspaceName } = result
  const payouts = await getPayouts(id)

  const enrolled = !!aff.enrolled
  const approved = !!aff.approved
  const status = !enrolled ? "Not enrolled" : approved ? "Active" : "Suspended"
  const level = levelByBand(aff.band as number | null)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/affiliates" className="hover:text-[#2563EB] flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Affiliates</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{workspaceName ?? (aff.referral_code as string)}</span>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{workspaceName ?? "Affiliate"}</h1>
                <Badge variant={approved ? "success" : enrolled ? "warning" : "default"}>{status}</Badge>
                <Badge variant="default" className="capitalize">{aff.origin as string}</Badge>
              </div>
              <p className="text-sm text-slate-500">{level.name} · {Math.round(level.rate * 100)}% recurring / {level.durationMonths}mo</p>
            </div>
          </div>
          {enrolled && <AffiliateActions workspaceId={aff.workspace_id as string} approved={approved} />}
        </div>
      </Card>

      {/* Balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Active referrals", String(aff.active_referrals_count ?? 0), "text-slate-700"],
          ["Pending", formatPence(Number(aff.pending_pence ?? 0)), "text-amber-600"],
          ["Cleared", formatPence(Number(aff.cleared_pence ?? 0)), "text-[#2563EB]"],
          ["Paid out", formatPence(Number(aff.paid_pence ?? 0)), "text-emerald-600"],
        ].map(([l, v, c]) => (
          <Card key={l} className="p-3">
            <p className="text-[11px] text-slate-400">{l}</p>
            <p className={`text-lg font-bold mt-0.5 ${c}`}>{v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Affiliate Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ["Referral code", (aff.referral_code as string) ?? "—"],
            ["Public handle", (aff.public_handle as string) ?? "—"],
            ["Payout email", (aff.payout_email as string) ?? "—"],
            ["Origin", (aff.origin as string) ?? "—"],
            ["Enrolled", aff.applied_at ? new Date(aff.applied_at as string).toLocaleDateString("en-GB") : "—"],
            ["Created", aff.created_at ? new Date(aff.created_at as string).toLocaleDateString("en-GB") : "—"],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-xs text-slate-400">{l}</p>
              <p className="text-xs font-medium text-slate-700 mt-0.5 break-all capitalize">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <PayoutReview payouts={payouts} />

      <Card className="p-4 border-amber-200 bg-[#FFFBEB]">
        <p className="text-xs text-amber-700">
          Commission accrues from paid invoices (Stripe webhook), clears after a 30-day cooling-off, and
          reverses on refund/chargeback/cancellation. Payouts are reviewed and processed manually during
          early release.
        </p>
      </Card>
    </div>
  )
}
