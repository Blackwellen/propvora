"use client"

import { ListingDetailShell } from "./ListingDetailShell"
import {
  OverviewPanel,
  ContentPanel,
  MediaPanel,
  RoomsPanel,
  AmenitiesPanel,
  PricingPanel,
  AvailabilityPanel,
  FeesPanel,
  RulesPanel,
  CheckInPanel,
  CompliancePanel,
  ChannelsPanel,
  BookingsPanel,
  MessagesPanel,
  ReviewsPanel,
  PerformancePanel,
  AIOptimiserPanel,
  SettingsPanel,
  ActivityPanel,
} from "./TabPanels"
import type {
  BookingListing,
  ListingPhoto,
  SavedPricingProfile,
  PublishReadiness,
  ListingAccommodation,
  CatalogueAmenity,
  KeylessLock,
} from "@/lib/booking/listings"
import type { BookingRow } from "../server"

/* ──────────────────────────────────────────────────────────────────────────
   ListingDetailClient — assembles all 19 tab panels and passes them to the
   shell. This is the "glue" client that the server page imports.
─────────────────────────────────────────────────────────────────────────── */

export interface ListingDetailClientProps {
  listing: BookingListing
  photos: ListingPhoto[]
  pricing: SavedPricingProfile | null
  readiness: PublishReadiness | null
  accommodation: ListingAccommodation | null
  amenityCatalogue: CatalogueAmenity[]
  selectedAmenitySlugs: string[]
  keylessLock: KeylessLock | null
  bookings: BookingRow[]
}

export function ListingDetailClient({
  listing,
  photos,
  pricing,
  readiness,
  accommodation,
  amenityCatalogue,
  selectedAmenitySlugs,
  keylessLock,
  bookings,
}: ListingDetailClientProps) {
  return (
    <ListingDetailShell
      listing={listing}
      photos={photos}
      pricing={pricing}
      readiness={readiness}
      panels={{
        overview: (
          <OverviewPanel
            listing={listing}
            pricing={pricing}
            readiness={readiness}
            photoCount={photos.length}
            upcomingBookings={
              bookings.filter(
                (b) =>
                  b.status !== "cancelled" &&
                  b.checkIn &&
                  b.checkIn >= new Date().toISOString().slice(0, 10)
              ).length
            }
          />
        ),
        content: <ContentPanel listing={listing} />,
        media: <MediaPanel listingId={listing.id} photos={photos} />,
        rooms: <RoomsPanel listing={listing} />,
        amenities: (
          <AmenitiesPanel
            listing={listing}
            amenityCatalogue={amenityCatalogue}
            selectedAmenitySlugs={selectedAmenitySlugs}
          />
        ),
        pricing: <PricingPanel listing={listing} pricing={pricing} />,
        availability: <AvailabilityPanel listingId={listing.id} />,
        fees: <FeesPanel listing={listing} pricing={pricing} />,
        rules: <RulesPanel listing={listing} />,
        checkin: <CheckInPanel listing={listing} keylessLock={keylessLock} />,
        compliance: <CompliancePanel listing={listing} />,
        channels: <ChannelsPanel listingId={listing.id} listingTitle={listing.title} />,
        bookings: <BookingsPanel listingId={listing.id} bookings={bookings} />,
        messages: <MessagesPanel listingId={listing.id} />,
        reviews: <ReviewsPanel listingId={listing.id} />,
        performance: <PerformancePanel listingId={listing.id} currency={listing.currency} />,
        ai: <AIOptimiserPanel listingId={listing.id} listing={listing} />,
        settings: <SettingsPanel listing={listing} />,
        activity: <ActivityPanel listingId={listing.id} />,
      }}
    />
  )
}

export default ListingDetailClient
