import Link from "next/link"
import { Home, ImageIcon, Tag, CheckCircle2, Pause, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmtMoney } from "@/components/bookings/primitives"
import type { ListingSummary } from "@/components/bookings/server-deep"

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  in_review: { label: "In review", cls: "bg-amber-50 text-amber-700" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", cls: "bg-orange-50 text-orange-700" },
  archived: { label: "Archived", cls: "bg-slate-50 text-slate-400" },
}

interface ListingCardProps {
  listing: ListingSummary
}

export function ListingCard({ listing: l }: ListingCardProps) {
  const badge = STATUS_BADGE[l.status] ?? STATUS_BADGE.draft

  return (
    <Link
      href={`/property-manager/bookings/listings/${l.id}`}
      className="group rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
        {l.coverPhotoId ? (
          <ImageIcon className="w-7 h-7 text-slate-300" />
        ) : (
          <Home className="w-8 h-8 text-slate-300" />
        )}
        <span
          className={cn(
            "absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
            badge.cls
          )}
        >
          {l.status === "published" ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : l.status === "paused" ? (
            <Pause className="w-3 h-3" />
          ) : (
            <CircleDot className="w-3 h-3" />
          )}
          {badge.label}
        </span>
      </div>
      <div className="px-4 py-3.5">
        <p className="font-semibold text-slate-800 truncate group-hover:text-[var(--brand)] transition-colors">
          {l.title}
        </p>
        <p className="text-[12px] text-slate-400 capitalize mt-0.5">
          {l.listingType.replace(/_/g, " ")} · {l.maxGuests} guests · {l.bedrooms} bd
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
            <Tag className="w-3.5 h-3.5" />
            {l.basePricePence != null
              ? `${fmtMoney(l.basePricePence, l.currency)}/night`
              : "No price set"}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-slate-400">
            <ImageIcon className="w-3.5 h-3.5" />
            {l.photoCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
