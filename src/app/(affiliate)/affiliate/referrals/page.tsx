"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { useAffiliate } from "../_useAffiliate"
import { formatPence } from "@/lib/affiliate/levels"

interface ReferralRow {
  id: string
  status: string
  created_at: string
  first_invoice_at: string | null
  initial_commission_pence: number | null
  recurring_commission_pence: number | null
  recurring_months_remaining: number | null
}

function statusBadge(s: string) {
  if (s === "active" || s === "converted") return <Badge variant="success" dot>Active</Badge>
  if (s === "trial") return <Badge variant="warning" dot>Trial</Badge>
  if (s === "pending" || s === "signed_up") return <Badge variant="sky" dot>Pending</Badge>
  if (s === "reversed" || s === "cancelled" || s === "refunded") return <Badge variant="danger" dot>{s}</Badge>
  return <Badge dot>{s}</Badge>
}

export default function AffiliateReferralsPage() {
  const { loading: affLoading, affiliate, workspaceId } = useAffiliate()
  const [rows, setRows] = useState<ReferralRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (affLoading) return
    if (!affiliate?.enrolled || !workspaceId) { setLoading(false); return }
    ;(async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("affiliate_referrals")
          .select("id, status, created_at, first_invoice_at, initial_commission_pence, recurring_commission_pence, recurring_months_remaining")
          .eq("affiliate_workspace_id", workspaceId)
          .order("created_at", { ascending: false })
        if (error && error.code !== "42P01") console.error(error)
        if (data) setRows(data as ReferralRow[])
      } finally {
        setLoading(false)
      }
    })()
  }, [affLoading, affiliate?.enrolled, workspaceId])

  if (affLoading || loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 rounded-xl" /></div>
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">You haven't enrolled yet. <Link href="/affiliate" className="text-[#2563EB] hover:underline">Join the programme</Link>.</p>
      </div>
    )
  }

  const active = rows.filter((r) => r.status === "active" || r.status === "converted").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Referrals</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {rows.length} total · {active} active paying · customer identities are masked for privacy.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          {rows.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No referrals yet. Share your link to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                    <th className="pb-2 pr-4">Referral</th>
                    <th className="pb-2 pr-4">Joined</th>
                    <th className="pb-2 pr-4">First paid</th>
                    <th className="pb-2 pr-4">Months left</th>
                    <th className="pb-2 pr-4">Commission</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map((r) => {
                    const comm = (r.initial_commission_pence ?? 0) + (r.recurring_commission_pence ?? 0)
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">{r.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">
                          {r.first_invoice_at ? new Date(r.first_invoice_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-slate-600">{r.recurring_months_remaining ?? "—"}</td>
                        <td className="py-2.5 pr-4 text-xs font-semibold text-slate-800">{formatPence(comm)}</td>
                        <td className="py-2.5">{statusBadge(r.status)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
