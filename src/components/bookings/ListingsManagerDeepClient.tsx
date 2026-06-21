"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DashboardContainer } from "@/components/layout/PageContainer"
import { MobileTopBar } from "@/components/mobile"
import { BookingUpgradePrompt, BookingNotReady } from "./primitives"
import { createListing } from "./actions-deep"
import type { ListingSummary } from "./server-deep"
import type { ListingType } from "@/lib/booking/booking-listings"
import { ListingsHeader } from "@/features/listings/components/ListingsHeader"
import { AllListingsTab } from "@/features/listings/components/AllListingsTab"
import { CreateListingDialog } from "@/features/listings/components/CreateListingDialog"

/* ──────────────────────────────────────────────────────────────────────────
   Listings manager (deep) — the workspace's booking_listings with status,
   pricing, photo count and publish progress. Create opens a quick-start that
   drops into the listing wizard.
─────────────────────────────────────────────────────────────────────────── */

interface Props {
  canManage: boolean
  ready: boolean
  planName: string
  upgradeReason: string | null
  listings: ListingSummary[]
  properties: { id: string; label: string; city: string | null }[]
}

export function ListingsManagerDeepClient({
  canManage,
  ready,
  planName,
  upgradeReason,
  listings,
  properties,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [listingType, setListingType] = useState<ListingType>("entire_home")
  const [err, setErr] = useState<string | null>(null)

  function create() {
    if (!title.trim()) {
      setErr("Enter a listing title.")
      return
    }
    setErr(null)
    startTransition(async () => {
      const res = await createListing({
        title: title.trim(),
        listingType,
        propertyId: propertyId || null,
      })
      if (res.ok && res.data) {
        router.push(`/property-manager/bookings/listings/${res.data.id}`)
      } else {
        setErr(res.error ?? "Could not create the listing.")
      }
    })
  }

  if (!canManage) {
    return (
      <DashboardContainer>
        <MobileTopBar title="Listings" subtitle="Booking management" showBack backHref="/property-manager/bookings" />
        <div className="px-4 md:px-6 py-4 md:py-6">
          <BookingUpgradePrompt planName={planName} reason={upgradeReason} />
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer>
      <MobileTopBar title="Listings" subtitle="Direct booking inventory" showBack backHref="/property-manager/bookings" />

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-5">
        <ListingsHeader count={listings.length} onNew={() => setShowCreate(true)} />

        {!ready ? (
          <BookingNotReady />
        ) : (
          <AllListingsTab listings={listings} onNew={() => setShowCreate(true)} />
        )}
      </div>

      <CreateListingDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={create}
        pending={pending}
        title={title}
        onTitleChange={setTitle}
        propertyId={propertyId}
        onPropertyIdChange={setPropertyId}
        listingType={listingType}
        onListingTypeChange={setListingType}
        properties={properties}
        error={err}
      />
    </DashboardContainer>
  )
}

export default ListingsManagerDeepClient
