"use client"

import React, { useEffect, useState, useCallback, lazy, Suspense } from "react"
import Link from "next/link"
import {
  Copy, Check, Share2, Mail, MessageCircle, ChevronRight, ExternalLink,
  TrendingUp, Users, Sparkles, Award, ArrowRight,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { enrolWorkspaceAffiliate } from "@/lib/actions/affiliate"
import { levelByBand, levelForReferrals, AFFILIATE_LEVELS, formatPence } from "@/lib/affiliate/levels"
import { getCommissionLedger, type CommissionLedgerRow } from "@/lib/affiliate/dashboard-data"

// Lazy-load charts to keep initial bundle lean
const LazyBarChart = lazy(() =>
  import("recharts").then((m) => ({
    default: function ReferralBarChart({ data }: { data: { month: string; count: number }[] }) {
      const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = m
      return (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v) => [Number(v ?? 0), "Referrals"]}
            />
            <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    },
  }))
)

const LazyAreaChart = lazy(() =>
  import("recharts").then((m) => ({
    default: function EarningsAreaChart({ data }: { data: { month: string; pence: number }[] }) {
      const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } = m
      return (
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => `£${(Number(v) / 100).toFixed(0)}`} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(v) => [`£${(Number(v ?? 0) / 100).toFixed(2)}`, "Earnings"]}
            />
            <Area type="monotone" dataKey="pence" stroke="#10b981" fill="url(#earningsGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
  }))
)

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
  initial_commission_pence: number | null
  recurring_commission_pence: number | null
}

function refBadge(status: string) {
  if (status === "converted" || status === "active") return <Badge variant="success" dot>Active</Badge>
  if (status === "trial") return <Badge variant="warning" dot>Trial</Badge>
  if (status === "pending" || status === "signed_up") return <Badge variant="sky" dot>Pending</Badge>
  if (status === "reversed" || status === "cancelled") return <Badge variant="danger" dot>Cancelled</Badge>
  return <Badge dot>{status}</Badge>
}

function commissionBadge(status: string) {
  if (status === "paid") return <Badge variant="success" dot>Paid</Badge>
  if (status === "payable") return <Badge variant="primary" dot>Cleared</Badge>
  if (status === "pending") return <Badge variant="warning" dot>Pending</Badge>
  if (status === "reversed") return <Badge variant="danger" dot>Reversed</Badge>
  return <Badge dot>{status}</Badge>
}

/** Tier progress bar — shows progress from current to next band */
function TierProgressBar({ activeReferrals, band }: { activeReferrals: number; band: number | null }) {
  const current = levelByBand(band)
  const next = AFFILIATE_LEVELS.find((l) => l.band === (current.band + 1))

  if (!next) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100">
        <Award className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs font-semibold text-amber-700">You&apos;ve reached the highest tier: {current.name}!</p>
      </div>
    )
  }

  const progress = Math.min(
    100,
    Math.round(((activeReferrals - current.minReferrals) / (next.minReferrals - current.minReferrals)) * 100)
  )
  const remaining = next.minReferrals - activeReferrals

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-semibold text-slate-700">{current.name}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-medium text-[#2563EB]">{next.name}</span>
        </div>
        <span className="text-[11px] text-slate-400">{activeReferrals} / {next.minReferrals} referrals</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2563EB] to-[#10b981] rounded-full transition-all duration-700"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500">
        {remaining > 0
          ? `${remaining} more active referral${remaining === 1 ? "" : "s"} to reach ${next.name} (${Math.round(next.rate * 100)}% rate, ${next.cookieWindowDays}-day cookie)`
          : `Ready to advance to ${next.name}!`}
      </p>
    </div>
  )
}

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [ledger, setLedger] = useState<CommissionLedgerRow[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

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
        const [refsResult, ledgerResult] = await Promise.all([
          supabase
            .from("affiliate_referrals")
            .select("id, status, created_at, initial_commission_pence, recurring_commission_pence")
            .eq("affiliate_workspace_id", wsId)
            .order("created_at", { ascending: false })
            .limit(8),
          getCommissionLedger(wsId),
        ])
        if (refsResult.data) setReferrals(refsResult.data as ReferralRow[])
        setLedger(ledgerResult)
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
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
  const activeReferrals = affiliate.active_referrals_count ?? 0
  const computedLevel = levelForReferrals(activeReferrals)
  const displayLevel = computedLevel.band > level.band ? computedLevel : level

  // Build chart data from referrals (last 6 months)
  const referralChartData = (() => {
    const months: { month: string; count: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push({ month: key.slice(5), count: 0 })
    }
    for (const r of referrals) {
      const key = r.created_at.slice(5, 7)
      const item = months.find((m) => m.month === key)
      if (item) item.count++
    }
    return months
  })()

  // Build earnings trend from ledger (last 6 months)
  const earningsChartData = (() => {
    const months: { month: string; pence: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push({ month: key.slice(5), pence: 0 })
    }
    for (const c of ledger) {
      if (c.status === "reversed") continue
      const key = c.created_at.slice(5, 7)
      const item = months.find((m) => m.month === key)
      if (item) item.pence += c.commission_pence ?? 0
    }
    return months
  })()

  // Conversion rate
  const totalRefs = referrals.length
  const converted = referrals.filter((r) => r.status === "active" || r.status === "converted").length
  const convRate = totalRefs > 0 ? Math.round((converted / totalRefs) * 100) : 0

  // Recent ledger rows
  const recentLedger = ledger.slice(0, 8)

  const recentReferralMapping: MobileCardMapping<ReferralRow> = {
    getKey: (row) => row.id,
    title: (row) => row.id.slice(0, 8).toUpperCase(),
    subtitle: (row) =>
      new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    badge: (row) => refBadge(row.status),
    fields: [
      {
        label: "Commission",
        render: (row) => formatPence((row.initial_commission_pence ?? 0) + (row.recurring_commission_pence ?? 0)),
      },
    ],
  }

  const ledgerMapping: MobileCardMapping<CommissionLedgerRow> = {
    getKey: (r) => r.id,
    title: (r) => formatPence(r.commission_pence),
    subtitle: (r) => new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    badge: (r) => commissionBadge(r.status),
    fields: [
      { label: "Ref", render: (r) => r.referral_id?.slice(0, 8).toUpperCase() ?? "—" },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-xl bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] text-white">
        <div>
          <h1 className="text-xl font-bold">Your Affiliate Dashboard</h1>
          <p className="text-sm text-slate-300 mt-0.5">
            {displayLevel.name} · earn {Math.round(displayLevel.rate * 100)}% recurring for {displayLevel.durationMonths} months per referral
          </p>
        </div>
        <Badge variant={affiliate.approved ? "success" : "warning"} size="lg">
          {affiliate.approved ? "Active" : "Pending approval"}
        </Badge>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Referrals", value: String(totalRefs), colour: "text-slate-700", bg: "bg-slate-100", icon: Users },
          { label: "Converted", value: String(converted), colour: "text-[#059669]", bg: "bg-[#ECFDF5]", icon: Check },
          { label: "Conv. Rate", value: `${convRate}%`, colour: "text-[#2563EB]", bg: "bg-[#EFF6FF]", icon: TrendingUp },
          { label: "Tier", value: displayLevel.name.split(" ")[0], colour: "text-[#7c3aed]", bg: "bg-violet-50", icon: Award },
          { label: "Pending", value: formatPence(affiliate.pending_pence ?? 0), colour: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", icon: TrendingUp },
          { label: "Paid Out", value: formatPence(affiliate.paid_pence ?? 0), colour: "text-[#10B981]", bg: "bg-[#ECFDF5]", icon: Check },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-3">
              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center mb-2", kpi.bg)}>
                <Icon className={cn("w-3.5 h-3.5", kpi.colour)} />
              </div>
              <p className={cn("text-base font-bold leading-none truncate", kpi.colour)}>{kpi.value}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-1 leading-tight">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Tier progress */}
      <TierProgressBar activeReferrals={activeReferrals} band={affiliate.band} />

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

        {/* Right: charts + recent referrals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-xs text-slate-500">Referrals (6 mo)</CardTitle></CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[140px] w-full rounded-lg" />}>
                  <LazyBarChart data={referralChartData} />
                </Suspense>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-xs text-slate-500">Earnings trend (6 mo)</CardTitle></CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[140px] w-full rounded-lg" />}>
                  <LazyAreaChart data={earningsChartData} />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Commission ledger */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Ledger</CardTitle>
              <Link href="/affiliate/earnings" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                Full earnings <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentLedger.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No commissions recorded yet. Commissions appear here when your referrals convert.</p>
                </div>
              ) : (
                <ResponsiveTable rows={recentLedger} mobile={ledgerMapping}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[540px]">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]">
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Referral</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Amount</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentLedger.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
                            {row.referral_id?.slice(0, 8).toUpperCase() ?? "—"}
                          </td>
                          <td className="py-2.5 pr-3 text-xs font-semibold text-slate-800">
                            {formatPence(row.commission_pence)}
                          </td>
                          <td className="py-2.5">{commissionBadge(row.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>

          {/* Recent referrals */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <Link href="/affiliate/referrals" className="text-xs text-[#2563EB] hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No referrals yet. Share your link to get started.</p>
                </div>
              ) : (
                <ResponsiveTable rows={referrals.slice(0, 6)} mobile={recentReferralMapping}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]">
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Referral</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Date</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2 pr-3">Commission</th>
                        <th className="text-left text-xs font-semibold text-slate-500 pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {referrals.slice(0, 6).map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-3 text-xs font-mono text-slate-700">{row.id.slice(0, 8).toUpperCase()}</td>
                          <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </td>
                          <td className="py-2.5 pr-3 text-xs font-semibold text-slate-800">
                            {formatPence((row.initial_commission_pence ?? 0) + (row.recurring_commission_pence ?? 0))}
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
