"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { formatMoney } from "./format"

/**
 * Mobile sticky bottom bar shown on the listing detail page.
 *
 * Visible only on screens narrower than `lg` (1024 px). Fades in after the
 * user scrolls past 300 px so it doesn't obscure the gallery on first load.
 * "Reserve" scrolls to the inline booking card at the bottom of the page.
 */
export default function MobileBookingBar({
  fromNightlyPence,
  currency,
  rating,
  reviewCount,
  bookingCardId = "booking-card",
}: {
  fromNightlyPence: number | null
  currency: string
  rating: number | null
  reviewCount: number | null
  bookingCardId?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-3 pb-1">
        <div>
          {fromNightlyPence != null ? (
            <p className="text-[16px] font-bold text-[#0B1B3F]">
              {formatMoney(fromNightlyPence, currency)}{" "}
              <span className="text-[13px] font-normal text-slate-500">/ night</span>
            </p>
          ) : (
            <p className="text-[15px] font-semibold text-[#0B1B3F]">Request a price</p>
          )}
          {rating != null && rating > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-slate-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="text-slate-400">· {reviewCount} reviews</span>
              )}
            </p>
          )}
        </div>
        <a
          href={`#${bookingCardId}`}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1D4ED8] px-6 text-[14.5px] font-semibold text-white hover:bg-[#1A45BE] transition-colors"
        >
          Reserve
        </a>
      </div>
    </div>
  )
}
