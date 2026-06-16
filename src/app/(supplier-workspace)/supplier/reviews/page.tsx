"use client"

import { Star, MessageSquareQuote } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTopBar } from "@/components/mobile"
import {
  SupplierPageHeader,
  SupplierCard,
  SupplierEmptyState,
  SupplierLoadingState,
  SupplierNotReady,
} from "@/components/supplier-workspace/ui"
import { useSupplierApi } from "@/components/supplier-workspace/useSupplierApi"
import { useSupplierApiUrl } from "@/components/supplier-workspace/SupplierWorkspaceContext"
import { shortDate } from "@/components/supplier-workspace/format"
import type { SupplierReview, SupplierProfile } from "@/components/supplier-workspace/types"

function Stars({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200")} />
      ))}
    </span>
  )
}

export default function SupplierReviewsPage() {
  const profile = useSupplierApi<SupplierProfile>(useSupplierApiUrl("/api/supplier/profile"), {
    select: (j) => (j as { profile?: SupplierProfile }).profile ?? (j as SupplierProfile),
  })
  const reviews = useSupplierApi<SupplierReview[]>(useSupplierApiUrl("/api/supplier/jobs/reviews"), {
    select: (j) => (j as { reviews?: SupplierReview[] }).reviews ?? (Array.isArray(j) ? (j as SupplierReview[]) : []),
  })

  const list = reviews.data ?? []
  const avg = profile.data?.average_rating ?? (list.length ? list.reduce((s, r) => s + (r.rating ?? 0), 0) / list.length : 0)
  const count = profile.data?.reviews_count ?? list.length

  // Distribution buckets 5→1
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: list.filter((r) => Math.round(r.rating ?? 0) === star).length,
  }))
  const maxN = Math.max(1, ...dist.map((d) => d.n))

  return (
    <div className="space-y-5">
      <MobileTopBar title="Reviews" subtitle="Your trust & reputation" />

      <SupplierPageHeader title="Reviews" subtitle="Verified feedback from completed jobs — your marketplace reputation" />

      {reviews.loading ? (
        <SupplierCard className="p-5"><SupplierLoadingState rows={4} /></SupplierCard>
      ) : reviews.notReady ? (
        <SupplierCard className="p-5">
          <SupplierNotReady icon={Star} title="Reviews coming online" description="Verified reviews from completed jobs appear here once the reviews service is connected." />
        </SupplierCard>
      ) : list.length === 0 ? (
        <SupplierCard className="p-5">
          <SupplierEmptyState
            icon={Star}
            title="No reviews yet"
            description="As you complete jobs, property managers can leave verified reviews. Strong ratings boost your ranking and trust in the marketplace."
          />
        </SupplierCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Summary */}
          <SupplierCard className="p-5 h-fit">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-4xl font-bold text-slate-900 leading-none">{avg.toFixed(1)}</p>
                <div className="mt-1.5"><Stars rating={avg} /></div>
                <p className="mt-1 text-xs text-slate-500">{count} review{count === 1 ? "" : "s"}</p>
              </div>
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

          {/* List */}
          <div className="space-y-3">
            {list.map((r, i) => (
              <SupplierCard key={r.id ?? i} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                      {(r.author ?? "PM").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.author ?? "Property manager"}</p>
                      <Stars rating={r.rating ?? 0} size="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{shortDate(r.created_at)}</span>
                </div>
                {r.title && <p className="mt-3 text-sm font-semibold text-slate-800">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{r.body}</p>}
                {r.job_reference && <p className="mt-2 text-[11px] text-slate-400">Job {r.job_reference}</p>}
                {r.reply && (
                  <div className="mt-3 ml-3 pl-3 border-l-2 border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <MessageSquareQuote className="w-3 h-3" /> Your reply
                    </p>
                    <p className="text-sm text-slate-600 mt-0.5">{r.reply}</p>
                  </div>
                )}
              </SupplierCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
