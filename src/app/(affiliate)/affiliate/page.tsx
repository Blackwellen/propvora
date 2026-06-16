"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Copy, Check, Share2, Mail, MessageCircle, ChevronRight, ExternalLink,
  TrendingUp, Users, Sparkles,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { enrolWorkspaceAffiliate } from "@/lib/actions/affiliate"
import { levelByBand, formatPence } from "@/lib/affiliate/levels"

interface AffiliateRow {
  workspace_id: string
  enrolled: boolean
  approved: boolean
  band: number | null
  referral_code: string | null
  active_referrals_count: number | null
  pending_pence: number | null
  cleared_pence: number | null
  paid_pence: number | null
}

interface ReferralRow {
  id: string
  status: string
  created_at: string
}

function refBadge(status: string) {
  if (status === "converted" || status === "active") return <Badge variant="success" dot>Active</Badge>
  if (status === "trial") return <Badge variant="warning" dot>Trial</Badge>
  if (status === "pending" || status === "signed_up") return <Badge variant="sky" dot>Pending</Badge>
  return <Badge dot>{status}</Badge>
}

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Resolve current workspace
      let wsId: string | null = null
      const { data: profile } = await supabase
        .from("profiles").select("current_workspace_id").eq("id", user.id).maybeSingle()
      wsId = (profile?.current_workspace_id as string | null) ?? null
      if (!wsId) {
        const { data: mem } = await supabase
          .from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle()
        wsId = (mem?.workspace_id as string | null) ?? null
      }
      setWorkspaceId(wsId)
      if (!wsId) { setLoading(false); return }

      const { data: aff, error: affErr } = await supabase
        .from("affiliates")
        .select("workspace_id, enrolled, approved, band, referral_code, active_referrals_count, pending_pence, cleared_pence, paid_pence")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (affErr && affErr.code !== "42P01" && affErr.code !== "PGRST116") console.error(affErr)
      setAffiliate((aff as AffiliateRow) ?? null)

      if (aff?.enrolled) {
        const { data: refs, error: refErr } = await supabase
          .from("affiliate_referrals")
          .select("id, status, created_at")
          .eq("affiliate_workspace_id", wsId)
          .order("created_at", { ascending: false })
          .limit(8)
        if (refErr && refErr.code !== "42P01") console.error(refErr)
        if (refs) setReferrals(refs as ReferralRow[])
      }
    } catch (err) {
      console.error(err)
      setError("Could not load dashboard data.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleEnrol() {
    if (!workspaceId) return
    setEnrolling(true)
    setError(null)
    try {
      const res = await enrolWorkspaceAffiliate(workspaceId)
      if (res.ok) { await load() }
      else setError(res.error ?? "Could not enrol. Please try again.")
    } finally {
      setEnrolling(false)
    }
  }

  const affiliateLink = affiliate?.referral_code
    ? `https://propvora.com/?ref=${affiliate.referral_code}`
    : ""

  function copyLink() {
    if (!affiliateLink) return
    navigator.clipboard
      .writeText(affiliateLink)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard permission denied / unavailable — fail silently.
      })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Not enrolled → internal one-click enrol door
  if (!affiliate?.enrolled) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Refer &amp; earn with Propvora</h1>
        <p className="text-sm text-slate-600">
          Enrol your workspace in one click and earn <strong className="text-[#2563EB]">10% recurring
          commission for 6 months</strong> on every paying customer you refer. Same programme, same
          commission as our external partners — no separate application needed.
        </p>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button variant="primary" onClick={handleEnrol} disabled={enrolling || !workspaceId}>
          {enrolling ? "Enrolling…" : "Enrol my workspace"}
        </Button>
        <p className="text-xs text-slate-400">
          By enrolling you agree to the{" "}
          <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline">Affiliate Terms</Link>.
          Self-referrals and referrals of existing customers are not eligible.
        </p>
      </div>
    )
  }

  const level = levelByBand(affiliate.band)
  const recent = referrals.slice(0, 6)

  const recentReferralMapping: MobileCardMapping<ReferralRow> = {
    getKey: (row) => row.id,
    title: (row) => row.id.slice(0, 8).toUpperCase(),
    subtitle: (row) =>
      new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    badge: (row) => refBadge(row.status),
    fields: [],
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-xl bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] text-white">
        <div>
          <h1 className="text-xl font-bold">Your Affiliate Dashboard</h1>
          <p className="text-sm text-slate-300 mt-0.5">
            {level.name} · earn {Math.round(level.rate * 100)}% recurring for {level.durationMonths} months per referral.
          </p>
        </div>
        <Badge variant={affiliate.approved ? "success" : "warning"} size="lg">
          {affiliate.approved ? "Active" : "Pending approval"}
        </Badge>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* KPI strip — live pence balances */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Referrals", value: String(affiliate.active_referrals_count ?? 0), colour: "text-slate-700", bg: "bg-slate-100", icon: Users },
          { label: "Pending", value: formatPence(affiliate.pending_pence ?? 0), colour: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", icon: TrendingUp },
          { label: "Cleared", value: formatPence(affiliate.cleared_pence ?? 0), colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: Check },
          { label: "Paid Out", value: formatPence(affiliate.paid_pence ?? 0), colour: "text-[#10B981]", bg: "bg-[#ECFDF5]", icon: Check },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-3">
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center mb-2", kpi.bg)}>
                <Icon className={cn("w-3.5 h-3.5", kpi.colour)} />
              </div>
              <p className={cn("text-lg font-bold leading-none", kpi.colour)}>{kpi.value}</p>
              <p className="text-[11px] font-medium text-slate-700 mt-1 leading-tight">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Affiliate link widget */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Your Referral Link</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-3 break-all">
                <p className="text-xs text-slate-500 mb-1">Unique link</p>
                <p className="text-sm font-mono text-[#2563EB] font-medium">{affiliateLink || "—"}</p>
              </div>
              <Button variant="primary" className="w-full" onClick={copyLink} disabled={!affiliateLink}>
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy link</>}
              </Button>

              {affiliateLink && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Share via</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: Mail, label: "Email", href: `mailto:?subject=Try Propvora&body=Use my link: ${affiliateLink}` },
                      { icon: ExternalLink, label: "X", href: `https://twitter.com/intent/tweet?text=Manage property smarter with Propvora ${affiliateLink}` },
                      { icon: ExternalLink, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${affiliateLink}` },
                      { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=Check out Propvora: ${affiliateLink}` },
                    ].map((s) => {
                      const Icon = s.icon
                      return (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors">
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span className="text-[9px] text-slate-500">{s.label}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              <Link href="/affiliate/links">
                <Button variant="outline" size="sm" className="w-full">
                  <Share2 className="w-4 h-4" /> Manage links &amp; assets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right: earnings + recent referrals */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <Link href="/affiliate/earnings" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                Full details <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Pending</p>
                  <p className="text-lg font-bold text-[#F59E0B]">{formatPence(affiliate.pending_pence ?? 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Cleared</p>
                  <p className="text-lg font-bold text-[#2563EB]">{formatPence(affiliate.cleared_pence ?? 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Paid out</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatPence(affiliate.paid_pence ?? 0)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Commission is pending for 30 days (cooling-off), then clears once payment is confirmed.
                Minimum payout {formatPence(level.minPayoutPence)}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <Link href="/affiliate/referrals" className="text-xs text-[#2563EB] hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No referrals yet. Share your link to get started.</p>
                </div>
              ) : (
                <ResponsiveTable rows={recent} mobile={recentReferralMapping}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]">
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2">Referral</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recent.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2.5 text-xs font-mono text-slate-700">{row.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-2.5 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-2.5">{refBadge(row.status)}</td>
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
      </div>
    </div>
  )
}
