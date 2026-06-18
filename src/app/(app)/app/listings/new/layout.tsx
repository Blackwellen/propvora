"use client"

import React from "react"
import { ListingDraftProvider } from "@/features/listings/wizard/data/useListingDraft"
import { ListingWizardLayout } from "@/features/listings/wizard/components/ListingWizardLayout"

export default function NewListingWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ListingDraftProvider>
      <ListingWizardLayout>{children}</ListingWizardLayout>
    </ListingDraftProvider>
  )
}
