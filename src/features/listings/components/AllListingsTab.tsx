import { Home, Plus } from "lucide-react"
import { BookingEmptyState } from "@/components/bookings/primitives"
import { ListingCard } from "./ListingCard"
import type { ListingSummary } from "@/components/bookings/server-deep"

interface AllListingsTabProps {
  listings: ListingSummary[]
  onNew: () => void
}

export function AllListingsTab({ listings, onNew }: AllListingsTabProps) {
  if (listings.length === 0) {
    return (
      <BookingEmptyState
        icon={Home}
        title="No booking listings yet"
        description="Booking listings are sellable stay products, separate from your property records. Create one to set pricing, availability and go live."
        action={
          <button
            onClick={onNew}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold bg-[#2563EB] text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create your first listing
          </button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  )
}
