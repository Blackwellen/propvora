import { Star } from "lucide-react"
import type { PublicListingReview } from "@/lib/booking/public"

/* ──────────────────────────────────────────────────────────────────────────
   StayReviews — social proof for the public stay detail page.

   Pure (server-renderable). Reads ONLY real `booking_reviews` rows surfaced via
   getPublicListingReviews(). Reviewer identity is intentionally not exposed
   publicly (guest names are not anon-readable) — each review reads as a verified
   guest, which is honest: a review can only exist after a completed, paid stay.
   When there are no reviews we render nothing (the caller decides the fallback).
─────────────────────────────────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < full ? "h-3.5 w-3.5 fill-amber-400 text-amber-400" : "h-3.5 w-3.5 fill-slate-200 text-slate-200"
          }
        />
      ))}
    </span>
  )
}

function relativeMonth(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d)
}

export default function StayReviews({
  reviews,
  averageRating,
  reviewCount,
}: {
  reviews: PublicListingReview[]
  averageRating: number | null
  reviewCount: number | null
}) {
  if (!reviews.length) return null
  const avg = averageRating ?? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const count = reviewCount ?? reviews.length

  return (
    <section>
      <div className="mb-3.5 flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        <h2 className="text-[16px] font-semibold text-[#0B1B3F]">
          {avg.toFixed(1)} · {count} review{count === 1 ? "" : "s"}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-2xl border border-[#EEF3FB] bg-white p-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Stars rating={r.rating} />
              {r.createdAt && (
                <span className="text-[11.5px] text-slate-400">{relativeMonth(r.createdAt)}</span>
              )}
            </div>
            {r.title && <p className="text-[13.5px] font-semibold text-[#0B1B3F]">{r.title}</p>}
            {r.body && (
              <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600 whitespace-pre-line">{r.body}</p>
            )}
            <p className="mt-2 text-[11.5px] font-medium text-emerald-600">Verified guest · stayed here</p>
          </article>
        ))}
      </div>
    </section>
  )
}
