"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Network, Users, TrendingUp, Copy, Check, Info, Trophy,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { ResponsiveTable, type MobileCardMapping } from "@/components/mobile"
import { useAffiliate } from "@/components/affiliate/useAffiliate"
import {
  formatPence, levelByBand, AFFILIATE_LEVELS, discountCodeFromHandle,
} from "@/lib/affiliate/levels"
import {
  getSubAffiliateNetwork, getMilestoneStatus,
  type SubAffiliateRow, type MilestoneStatusRow,
} from "@/lib/affiliate/dashboard-data"
import { cn } from "@/lib/utils"

function bandName(band: number | null) {
  return levelByBand(band)?.name ?? "Approved Affiliate"
}

function bandBadge(band: number | null) {
  const b = levelByBand(band)
  const colours: Record<number, string> = {
    1: "bg-slate-100 text-slate-600",
    2: "bg-sky-50 text-sky-700",
    3: "bg-blue-50 text-blue-700",
    4: "bg-violet-50 text-violet-700",
    5: "bg-amber-50 text-amber-700",
  }
  const cls = colours[b.band] ?? colours[1]
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide", cls)}>
      {b.name}
    </span>
  )
}

const subMobileMapping: MobileCardMapping<SubAffiliateRow> = {
  getKey: (r) => r.workspace_id,
  title: (r) => `${r.workspace_id.slice(0, 8).toUpperCase()}…`,
  subtitle: (r) =>
    r.enrolled_at
      ? `Joined ${new Date(r.enrolled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : "Unknown join date",
  badge: (r) => bandBadge(r.band),
  fields: [
    { label: "Their referrals", render: (r) => String(r.active_referrals_count) },
    { label: "You earned",      render: (r) => formatPence(r.parent_earned_pence) },
  ],
}

export function AffiliateNetwork({ basePath }: { basePath: string }) {
  const { loading: affLoading, affiliate, workspaceId } = useAffiliate()
  const [subs, setSubs] = useState<SubAffiliateRow[]>([])
  const [milestones, setMilestones] = useState<MilestoneStatusRow[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedRecruit, setCopiedRecruit] = useState(false)

  useEffect(() => {
    if (affLoading) return
    if (!affiliate?.enrolled || !workspaceId) { setLoading(false); return }
    Promise.all([
      getSubAffiliateNetwork(workspaceId),
      getMilestoneStatus(workspaceId),
    ]).then(([netData, msData]) => {
      setSubs(netData)
      setMilestones(msData)
      setLoading(false)
    })
  }, [affLoading, affiliate?.enrolled, workspaceId])

  const recruitLink = workspaceId
    ? `https://propvora.com/affiliate-programme/apply?recruited_by=${workspaceId}`
    : ""
  const discountCode = affiliate?.referral_code
    ? (affiliate.discount_referral_code ?? discountCodeFromHandle(affiliate.referral_code))
    : ""

  const totalSubEarned = subs.reduce((s, r) => s + r.parent_earned_pence, 0)
  const totalSubReferrals = subs.reduce((s, r) => s + r.active_referrals_count, 0)

  if (affLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!affiliate?.enrolled) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">
          You haven&apos;t enrolled yet.{" "}
          <Link href={basePath} className="text-[#2563EB] hover:underline">Join the programme</Link>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Affiliate Network</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Recruit other affiliates and earn <strong>3–5%</strong> on every customer they convert — on top of their own commission.
          One level deep (they recruit their own network independently).
        </p>
      </div>

      {/* How it works banner */}
      <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 flex items-start gap-3">
        <Info className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
        <div className="space-y-1 text-sm text-violet-800">
          <p className="font-semibold">How network earn-through works</p>
          <ul className="space-y-0.5 text-xs text-violet-700 list-disc list-inside">
            <li>You share your recruit link with a property consultant, agent, or content creator.</li>
            <li>They apply, get approved, and start referring their own customers.</li>
            <li>When their customer pays a subscription, you earn <strong>3% (bands 1–3)</strong> or <strong>5% (bands 4–5)</strong> of that invoice — in addition to the sub-affiliate&apos;s own 10–15%.</li>
            <li>Propvora pays both commissions — the customer pays normal price.</li>
            <li>Sub-affiliates cannot recruit further under you (1 level only).</li>
          </ul>
        </div>
      </div>

      {/* Recruit link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-4 h-4 text-violet-500" /> Your recruit-an-affiliate link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg">
            <p className="flex-1 text-sm font-mono text-violet-700 break-all">{recruitLink || "—"}</p>
            <button
              disabled={!recruitLink}
              onClick={() => {
                navigator.clipboard?.writeText(recruitLink)
                  .then(() => { setCopiedRecruit(true); setTimeout(() => setCopiedRecruit(false), 1500) })
                  .catch(() => {})
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700 hover:border-violet-300 shrink-0 disabled:opacity-40"
            >
              {copiedRecruit ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRecruit ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Share this with people who have their own property audience. When they apply and use this link,
            they are tagged to your network on approval.
          </p>
          {discountCode && (
            <p className="text-xs text-slate-400">
              You can also tell them to mention your affiliate code <code className="bg-slate-100 px-1 rounded">{discountCode}</code> if applying via the standard form.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Network KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Sub-affiliates in network", value: String(subs.length),        colour: "text-violet-700",  icon: Users },
          { label: "Their total referrals",     value: String(totalSubReferrals),   colour: "text-[#2563EB]",   icon: TrendingUp },
          { label: "You earned (earn-through)", value: formatPence(totalSubEarned), colour: "text-[#059669]",   icon: Trophy },
        ].map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-4">
              <Icon className={cn("w-4 h-4 mb-2", kpi.colour)} />
              <p className={cn("text-xl font-bold", kpi.colour)}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </Card>
          )
        })}
      </div>

      {/* Sub-affiliate table */}
      <Card>
        <CardHeader>
          <CardTitle>Your sub-affiliates</CardTitle>
          <p className="text-xs text-slate-400">
            Workspace IDs are masked for privacy. You see aggregate performance, not customer data.
          </p>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Network className="w-10 h-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-sm font-medium text-slate-600">No sub-affiliates yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Share your recruit link with property consultants, letting agents, or content creators.
                  Every affiliate they become earns you 3–5% on their sales.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveTable rows={subs} mobile={subMobileMapping}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                      <th className="pb-2 pr-3">Sub-affiliate</th>
                      <th className="pb-2 pr-3">Joined</th>
                      <th className="pb-2 pr-3">Band</th>
                      <th className="pb-2 pr-3">Their referrals</th>
                      <th className="pb-2 pr-3">Their pending</th>
                      <th className="pb-2">You earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {subs.map((s) => (
                      <tr key={s.workspace_id} className="hover:bg-slate-50">
                        <td className="py-2.5 pr-3 font-mono text-xs text-slate-600">
                          {s.workspace_id.slice(0, 8).toUpperCase()}…
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500 whitespace-nowrap">
                          {s.enrolled_at
                            ? new Date(s.enrolled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3">{bandBadge(s.band)}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-700 font-medium">{s.active_referrals_count}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-500">{formatPence(s.pending_pence)}</td>
                        <td className="py-2.5 text-xs font-semibold text-emerald-700">{formatPence(s.parent_earned_pence)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Milestone progress */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Milestone bonuses
            </CardTitle>
            <p className="text-xs text-slate-400">Cash bonuses auto-credited when you hit referral milestones.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                      <div className="flex items-center gap-2">
                        {m.awarded && (
                          <Badge variant="success" size="sm">Awarded</Badge>
                        )}
                        <span className={cn("text-xs font-semibold", m.awarded ? "text-emerald-600" : "text-slate-500")}>
                          {m.awarded
                            ? m.awardedAt
                              ? new Date(m.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                              : "Credited"
                            : `${m.currentCount} / ${m.threshold} referrals`}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", m.awarded ? "bg-emerald-400" : "bg-amber-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {!m.awarded && (
                      <p className="text-xs text-slate-400">
                        {m.threshold - m.currentCount} more active paying referrals needed to unlock {formatPence(m.bonusPence)} bonus.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Band earn-through table */}
      <Card>
        <CardHeader>
          <CardTitle>Earn-through rates by band</CardTitle>
          <p className="text-xs text-slate-400">Your sub-affiliate earn-through rate is based on your own band, not theirs.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left text-xs font-semibold text-slate-500">
                  <th className="pb-2 pr-4">Your band</th>
                  <th className="pb-2 pr-4">Direct commission</th>
                  <th className="pb-2">Earn-through rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {AFFILIATE_LEVELS.map((lvl) => (
                  <tr key={lvl.band} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4 text-xs font-medium text-slate-700">{lvl.name}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-600">{Math.round(lvl.rate * 100)}%</td>
                    <td className="py-2.5 text-xs font-semibold text-violet-700">{Math.round(lvl.subAffiliateRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Earn-through is paid on the same invoice amount as the direct affiliate&apos;s commission and follows the same 30-day cooling-off before it clears.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
