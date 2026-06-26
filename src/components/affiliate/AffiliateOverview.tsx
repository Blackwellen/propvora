"use client"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Copy, Check, Share2, Mail, MessageCircle, ChevronRight, ExternalLink,
  TrendingUp, Users, Sparkles, Percent, Clock, Wallet, Tag, Trophy, Network,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { enrolWorkspaceAffiliate } from "@/lib/actions/affiliate"
import { levelByBand, formatPence, discountCodeFromHandle, DISCOUNT_LINK_PERCENT } from "@/lib/affiliate/levels"
import { getMilestoneStatus, getSubAffiliateNetwork, type MilestoneStatusRow, type SubAffiliateRow } from "@/lib/affiliate/dashboard-data"

interface AffiliateRow {
  workspace_id: string
  enrolled: boolean
  approved: boolean
  band: number | null
  referral_code: string | null
  discount_referral_code: string | null
  active_referrals_count: number | null
  sub_affiliate_count: number | null
  pending_pence: number | null
  cleared_pence: number | null
  paid_pence: number | null
  sub_pending_pence: number | null
  sub_cleared_pence: number | null
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

const ENROL_BENEFITS = [
  { icon: Percent,  title: "10–15% recurring",     sub: "Commission on eligible subscription revenue, 6 months per referral." },
  { icon: Tag,      title: `${DISCOUNT_LINK_PERCENT}% off discount link`, sub: "Give cold audiences a discount — earns the same commission, customer gets 30-day trial." },
  { icon: Network,  title: "Network earn-through",  sub: "Recruit other affiliates, earn 3–5% on every sale they make." },
  { icon: Trophy,   title: "Milestone bonuses",     sub: "£50 at 5 referrals, £150 at 15, £500 at 50 — cash added to your ledger automatically." },
  { icon: Clock,    title: "60-day cookie",         sub: "Last-click attribution within a 60-day window." },
  { icon: Wallet,   title: "£50 payout threshold",  sub: "Withdraw once cleared commission reaches £50." },
]

function MilestonePanel({ milestones }: { milestones: MilestoneStatusRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Milestone bonuses
        </CardTitle>
        <p className="text-xs text-slate-400">Cash bonuses auto-credited at each milestone.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {milestones.map((m) => {
          const pct = Math.min(100, Math.round((m.currentCount / m.threshold) * 100))
          return (
            <div key={m.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.awarded
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-sm font-medium text-slate-700">{m.label}</span>
                </div>
                <span className={cn("text-xs font-semibold", m.awarded ? "text-emerald-600" : "text-slate-500")}>
                  {m.awarded
                    ? `Awarded${m.awardedAt ? ` ${new Date(m.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`
                    : `${m.currentCount} / ${m.threshold}`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", m.awarded ? "bg-emerald-400" : "bg-amber-400")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function SubNetworkMiniPanel({ subs, basePath }: { subs: SubAffiliateRow[]; basePath: string }) {
  const totalEarned = subs.reduce((s, r) => s + r.parent_earned_pence, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-4 h-4 text-violet-500" /> Your affiliate network
        </CardTitle>
        <Link href={`${basePath}/network`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
          Full network <ChevronRight className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {subs.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Network className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-400">
              No sub-affiliates yet. Share your{" "}
              <Link href={`${basePath}/links`} className="text-[#2563EB] hover:underline">recruit link</Link>{" "}
              to start building your network.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-violet-50">
                <p className="text-base font-bold text-violet-700">{subs.length}</p>
                <p className="text-[11px] text-violet-500">Sub-affiliates</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <p className="text-base font-bold text-emerald-700">{formatPence(totalEarned)}</p>
                <p className="text-[11px] text-emerald-500">Earn-through</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {subs.slice(0, 3).map((s) => (
                <div key={s.workspace_id} className="py-2 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">{s.workspace_id.slice(0, 8).toUpperCase()}…</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">{s.active_referrals_count} refs</span>
                    <span className="font-semibold text-emerald-700">{formatPence(s.parent_earned_pence)}</span>
                  </div>
                </div>
              ))}
            </div>
            {subs.length > 3 && (
              <Link href={`${basePath}/network`} className="block text-xs text-center text-[#2563EB] hover:underline pt-1">
                View all {subs.length} →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AffiliateOverview({ basePath }: { basePath: string }) {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneStatusRow[]>([])
  const [subNetwork, setSubNetwork] = useState<SubAffiliateRow[]>([])
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
        .select("workspace_id, enrolled, approved, band, referral_code, discount_referral_code, active_referrals_count, sub_affiliate_count, pending_pence, cleared_pence, paid_pence, sub_pending_pence, sub_cleared_pence")
        .eq("workspace_id", wsId)
        .maybeSingle()
      if (affErr && affErr.code !== "42P01" && affErr.code !== "PGRST116") console.error(affErr)
      setAffiliate((aff as AffiliateRow) ?? null)

      if (aff?.enrolled) {
        const [refs, msData, netData] = await Promise.all([
          supabase
            .from("affiliate_referrals")
            .select("id, status, created_at")
            .eq("affiliate_workspace_id", wsId)
            .order("created_at", { ascending: false })
            .limit(8),
          getMilestoneStatus(wsId),
          getSubAffiliateNetwork(wsId),
        ])
        if (refs.data) setReferrals(refs.data as ReferralRow[])
        setMilestones(msData)
        setSubNetwork(netData)
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

  const discountLink = affiliate?.referral_code
    ? `https://propvora.com/?ref=${affiliate.discount_referral_code ?? discountCodeFromHandle(affiliate.referral_code)}`
    : ""

  function copyLink() {
    if (!affiliateLink) return
    navigator.clipboard?.writeText(affiliateLink)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {})
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
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Refer &amp; earn with Propvora</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Enrol your workspace in one click. Earn <strong className="text-[#2563EB]">10% recurring
            commission for 6 months</strong> on every paying customer you refer, plus network earn-through
            and cash milestone bonuses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ENROL_BENEFITS.map((b) => {
            const Icon = b.icon
            return (
              <div key={b.title} className="flex items-start gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        <Card>
          <CardContent className="pt-5 space-y-4">
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600">
                By enrolling you agree to the{" "}
                <Link href="/affiliate-programme/terms" className="text-[#2563EB] hover:underline" target="_blank">
                  Affiliate Terms
                </Link>
                . Self-referrals and referrals of existing customers are not eligible for commission.
              </p>
            </div>
            <Button variant="primary" className="w-full" onClick={handleEnrol} disabled={enrolling || !workspaceId}>
              {enrolling ? "Enrolling…" : "Enrol my workspace"}
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Not a customer yet? Apply via the{" "}
              <Link href="/affiliate-programme/apply" className="text-[#2563EB] hover:underline">
                public partner programme
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const level = levelByBand(affiliate.band)
  const recent = referrals.slice(0, 6)
  const totalEarnings = (affiliate.pending_pence ?? 0) + (affiliate.cleared_pence ?? 0) + (affiliate.paid_pence ?? 0)
  const totalSubEarnings = (affiliate.sub_pending_pence ?? 0) + (affiliate.sub_cleared_pence ?? 0)

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
            {level.name} · earn {Math.round(level.rate * 100)}% recurring for {level.durationMonths} months
            {(affiliate.sub_affiliate_count ?? 0) > 0 && ` · ${affiliate.sub_affiliate_count} in your network`}
          </p>
        </div>
        <Badge variant={affiliate.approved ? "success" : "warning"} size="lg">
          {affiliate.approved ? "Active" : "Pending approval"}
        </Badge>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Referrals",   value: String(affiliate.active_referrals_count ?? 0), colour: "text-slate-700",  bg: "bg-slate-100",    icon: Users },
          { label: "Direct Pending",     value: formatPence(affiliate.pending_pence ?? 0),     colour: "text-[#F59E0B]",  bg: "bg-[#FFFBEB]",    icon: TrendingUp },
          { label: "Network Earned",     value: formatPence(totalSubEarnings),                  colour: "text-[#7C3AED]",  bg: "bg-violet-50",    icon: Network },
          { label: "Total Paid Out",     value: formatPence(affiliate.paid_pence ?? 0),         colour: "text-[#10B981]",  bg: "bg-[#ECFDF5]",    icon: Check },
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
        {/* Left: link widget + milestone + network */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle>Your Referral Links</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {/* Standard link */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Standard link</p>
                <div className="bg-slate-50 rounded-lg p-2.5 break-all">
                  <p className="text-xs font-mono text-[#2563EB]">{affiliateLink || "—"}</p>
                </div>
              </div>
              {/* Discount link */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-slate-400">{DISCOUNT_LINK_PERCENT}% off link</p>
                  <Badge size="sm" variant="success">Discount</Badge>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2.5 break-all">
                  <p className="text-xs font-mono text-emerald-700">{discountLink || "—"}</p>
                </div>
              </div>

              <Button variant="primary" className="w-full" onClick={copyLink} disabled={!affiliateLink}>
                {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy standard link</>}
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

              <Link href={`${basePath}/links`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Share2 className="w-4 h-4" /> All links &amp; assets
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Milestone progress */}
          {milestones.length > 0 && <MilestonePanel milestones={milestones} />}

          {/* Sub-affiliate network mini panel */}
          <SubNetworkMiniPanel subs={subNetwork} basePath={basePath} />
        </div>

        {/* Right: earnings + recent referrals */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Overview</CardTitle>
              <Link href={`${basePath}/earnings`} className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                Full details <ChevronRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Direct pending</p>
                  <p className="text-lg font-bold text-[#F59E0B]">{formatPence(affiliate.pending_pence ?? 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Direct cleared</p>
                  <p className="text-lg font-bold text-[#2563EB]">{formatPence(affiliate.cleared_pence ?? 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-400">Network earned</p>
                  <p className="text-lg font-bold text-violet-600">{formatPence(totalSubEarnings)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-400">Total paid out</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatPence(affiliate.paid_pence ?? 0)}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 col-span-2 sm:col-span-2">
                  <p className="text-xs text-slate-400">All-time earned</p>
                  <p className="text-lg font-bold text-amber-600">{formatPence(totalEarnings + totalSubEarnings)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Commission is pending for 30 days (cooling-off), then clears. Minimum payout {formatPence(level.minPayoutPence)}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <Link href={`${basePath}/referrals`} className="text-xs text-[#2563EB] hover:underline">View all</Link>
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
