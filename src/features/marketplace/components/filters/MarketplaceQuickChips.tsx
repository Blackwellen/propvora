"use client"

import React from "react"
import { Zap, ShieldCheck, Clock, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MpFilters } from "@/components/marketplace-public/filters"
import { togglesForIntent } from "@/components/marketplace-public/filters"
import type { IntentKey } from "@/components/marketplace-public/intent"

interface Props {
  intentKey: IntentKey
  filters: MpFilters
  onChange: (x: Partial<MpFilters>) => void
}

function QuickChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/** Quick-toggle chips (Instant book / Verified / Available now / Top rated). */
export default function MarketplaceQuickChips({ intentKey, filters, onChange }: Props) {
  const toggles = togglesForIntent(intentKey)
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {toggles.instantBook && (
        <QuickChip
          active={filters.instantBook}
          onClick={() => onChange({ instantBook: !filters.instantBook })}
          icon={<Zap className="h-3.5 w-3.5" />}
        >
          Instant book
        </QuickChip>
      )}
      {toggles.verified && (
        <QuickChip
          active={filters.verifiedOnly}
          onClick={() => onChange({ verifiedOnly: !filters.verifiedOnly })}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        >
          Verified
        </QuickChip>
      )}
      {toggles.availableNow && (
        <QuickChip
          active={filters.availableNow}
          onClick={() => onChange({ availableNow: !filters.availableNow })}
          icon={<Clock className="h-3.5 w-3.5" />}
        >
          Available now
        </QuickChip>
      )}
      {toggles.rating && (
        <QuickChip
          active={filters.minRating >= 4.5}
          onClick={() => onChange({ minRating: filters.minRating >= 4.5 ? 0 : 4.5 })}
          icon={<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
        >
          Top rated
        </QuickChip>
      )}
    </div>
  )
}
