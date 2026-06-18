"use client"

import React from "react"
import { Star, ShieldCheck, MessageSquareReply, Timer, Award, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SupplierCard,
  SupplierKpiStrip,
  SupplierLoadingState,
  SupplierStatusBadge,
  type SupplierKpi,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierReview, SupplierProfile } from "@/components/supplier-workspace/types"

interface AnalyticsLite { slaHitPct?: number; avgResponseHours?: number }

function Stars({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")}
        />
      ))}
    </span>
  )
}

/* Reputation OVERVIEW — at-a-glance trust scorecard derived from the supplier
   profile, verified reviews and responsiveness analytics. */
export default function SupplierReputationOverview() {
  const profile = useSupplierApi<SupplierProfile>(useSupplierApiUrl("/api/supplier/profile"), {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const reviews = useSupplierApi<SupplierReview[]>(useSupplierApiUrl("/api/supplier/jobs/reviews"), {
    select: (j) => (j as { reviews?: SupplierReview[] }).reviews ?? (Array.isArray(j) ? (j as SupplierReview[]) : []),
  })
  const analytics = useSupplierApi<AnalyticsLite>(useSupplierApiUrl("/api/supplier/analytics"), {
    select: (j) => j as AnalyticsLite,
  })

  if (profile.loading || reviews.loading) {
    return <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
  }

  const list = reviews.data ?? []
  const avg = profile.data?.average_rating ?? (list.length ? list.reduce((s, r) => s + (r.rating ?? 0), 0) / list.length : 0)
  const count = profile.data?.reviews_count ?? list.length
  const replied = list.filter((r) => r.reply && r.reply.trim().length > 0).length
  const replyRatePct = list.length > 0 ? Math.round((replied / list.length) * 100) : 0
  const fiveStar = list.filter((r) => Math.round(r.rating ?? 0) === 5).length
  const fiveStarPct = list.length > 0 ? Math.round((fiveStar / list.length) * 100) : 0
  const slaHit = analytics.data?.slaHitPct
  const avgResp = analytics.data?.avgResponseHours

  // Composite trust band from rating + responsiveness + reply rate.
  const band =
    avg >= 4.7 && replyRatePct >= 70 ? { label: "Outstanding", tone: "emerald" as const }
    : avg >= 4.2 ? { label: "Strong", tone: "blue" as const }
    : avg >= 3.5 ? { label: "Building", tone: "amber" as const }
    : { label: "Getting started", tone: "slate" as const }

  const kpis: SupplierKpi[] = [
    { label: "Average rating", value: avg ? avg.toFixed(1) : "—", icon: Star },
    { label: "Verified reviews", value: String(count), icon: Award },
    { label: "Reply rate", value: `${replyRatePct}%`, icon: MessageSquareReply },
    { label: "Response SLA", value: slaHit != null ? `${slaHit}%` : "—", icon: Timer },
  ]

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: list.filter((r) => Math.round(r.rating ?? 0) === star).length,
  }))
  const maxN = Math.max(1, ...dist.map((d) => d.n))
  const recent = list.slice(0, 3)

  return (
    <div className="space-y-5">
      <SupplierKpiStrip kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* Scorecard */}
        <SupplierCard className="p-5 h-fit">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-slate-900 leading-none">{avg ? avg.toFixed(1) : "—"}</p>
              <div className="mt-1.5"><Stars rating={avg} /></div>
              <p className="mt-1 text-xs text-slate-500">{count} verified review{count === 1 ? "" : "s"}</p>
            </div>
            <SupplierStatusBadge tone={band.tone}>
              <ShieldCheck className="w-3 h-3" /> {band.label}
            </SupplierStatusBadge>
          </div>

          <div className="mt-5 space-y-1.5">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-slate-500">{d.star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(d.n / maxN) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-slate-400">{d.n}</span>
              </div>
            ))}
          </div>
        </SupplierCard>

        {/* Signals + recent */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SupplierCard className="p-4">
              <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />5-star share</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{fiveStarPct}%</p>
              <p className="text-[11px] text-slate-400">{fiveStar} of {list.length || 0} reviews</p>
            </SupplierCard>
            <SupplierCard className="p-4">
              <p className="text-xs text-slate-400 flex items-center gap-1"><MessageSquareReply className="w-3.5 h-3.5" />Replied</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{replied}</p>
              <p className="text-[11px] text-slate-400">{replyRatePct}% reply rate</p>
            </SupplierCard>
            <SupplierCard className="p-4">
              <p className="text-xs text-slate-400 flex items-center gap-1"><Timer className="w-3.5 h-3.5" />Avg response</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{avgResp != null ? `${avgResp}h` : "—"}</p>
              <p className="text-[11px] text-slate-400">First quote response</p>
            </SupplierCard>
          </div>

          <SupplierCard className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">Recent reviews</p>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet — complete jobs to start earning verified feedback.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((r, i) => (
                  <li key={r.id ?? i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-500 shrink-0">
                      {(r.author ?? "PM").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.author ?? "Property manager"}</p>
                        <span className="text-[11px] text-slate-400 shrink-0">{shortDate(r.created_at)}</span>
                      </div>
                      <Stars rating={r.rating ?? 0} size="w-3 h-3" />
                      {r.body && <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{r.body}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SupplierCard>
        </div>
      </div>
    </div>
  )
}
